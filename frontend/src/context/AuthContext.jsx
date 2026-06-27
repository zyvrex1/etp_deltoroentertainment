import { createContext, useReducer, useEffect, useRef } from 'react'
import { setAccessToken, clearAccessToken } from '../services/api'
import api from '../services/api'

export const AuthContext = createContext()

// Module-level flag — survives React StrictMode's unmount→remount cycle
// (unlike useRef, which resets on remount). Prevents two concurrent
// /auth/refresh calls that would trigger token reuse detection → 401.
let _sessionRestored = false

function msUntilExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 - Date.now()
  } catch {
    return 0
  }
}

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload }
    case 'UPDATE_TOKEN':
      return { ...state, user: { ...state.user, token: action.payload } }
    case 'LOGOUT':
      return {
        ...state,
        user: action.payload ?? null,  // keeps public shell if provided
      }
    case 'FINISH_LOADING':
      return { ...state, loading: false }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
  const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (_) {}

  cancelProactiveRefresh()
  clearAccessToken()

  const shell = state.user
    ? {
        firstName: state.user.firstName,
        lastName:  state.user.lastName,
        avatar:    state.user.avatar,
      }
    : null

  dispatch({ type: 'LOGOUT', payload: shell })
}
  const [state, dispatch] = useReducer(authReducer, {
    user:    null,
    loading: true,
  })

  // Holds the proactive refresh timer so we can cancel it on logout
  const refreshTimerRef = useRef(null)

  const scheduleProactiveRefresh = (token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    const delay = msUntilExpiry(token) - 60_000  // fire 60s before expiry
    if (delay <= 0) return

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.token)
        dispatch({ type: 'UPDATE_TOKEN', payload: data.token })
        scheduleProactiveRefresh(data.token)  // schedule next rotation
      } catch {
        // let the 401 interceptor handle cleanup on the next real request
      }
    }, delay)
  }

  const cancelProactiveRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }

  // ── Silent session restore on page load ───────────────────────
  // Instead of reading from localStorage, we call /auth/refresh.
  // The HttpOnly cookie is sent automatically and — if valid —
  // returns a fresh access token so the user stays logged in.
  //
  // IMPORTANT: React StrictMode double-invokes useEffect in development.
  // A module-level flag (not a useRef) is used here because useRef resets
  // on StrictMode's unmount→remount cycle, causing two simultaneous
  // /auth/refresh calls. The second call trips reuse-detection and deletes
  // the entire token family → 401 on every subsequent page refresh.
  //
  // A module-level variable persists for the entire JS module lifetime,
  // so the second effect invocation sees true and bails immediately.

  useEffect(() => {
    // Prevent double-invocation in React StrictMode
    if (_sessionRestored) return
    _sessionRestored = true

    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh')

        setAccessToken(data.token)
        scheduleProactiveRefresh(data.token)  // ✅ start timer after restore

        const profileRes = await api.get('/auth/profile')

        dispatch({
          type:    'LOGIN',
          payload: { ...profileRes.data, token: data.token },
        })
      } catch {
        clearAccessToken()
      } finally {
        dispatch({ type: 'FINISH_LOADING' })
      }
    }

    restoreSession()
  }, [])



  // ── Global session-expired handler ────────────────────────────
  // api.js fires 'auth:sessionExpired' when both the access token and
  // the refresh token are dead (e.g. cookie expired, reuse detected).
   useEffect(() => {
    const handleExpired = () => {
      cancelProactiveRefresh()  // ✅ stop timer before clearing state
      clearAccessToken()
      dispatch({ type: 'LOGOUT' })
    }

    window.addEventListener('auth:sessionExpired', handleExpired)
    return () => window.removeEventListener('auth:sessionExpired', handleExpired)
  }, [])

    return (
<AuthContext.Provider value={{ ...state, state, dispatch, scheduleProactiveRefresh, cancelProactiveRefresh }}>
        {children}
    </AuthContext.Provider>
  )
}