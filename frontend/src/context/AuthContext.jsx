import { createContext, useReducer, useEffect, useRef } from 'react'
import { setAccessToken, clearAccessToken } from '../services/api'
import api from '../services/api'

export const AuthContext = createContext()

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

// Global promise to deduplicate StrictMode double-mount refresh requests
let restorePromise = null

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user:    null,
    loading: true,
  })

  // Holds the proactive refresh timer so we can cancel it on logout
  const refreshTimerRef = useRef(null)

  const cancelProactiveRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }

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

  // ── Silent session restore on page load ───────────────────────
  // Calls /auth/refresh on mount. The HttpOnly cookie is sent automatically
  // and — if valid — returns a fresh access token so the user stays logged in.
  //
  // Uses an AbortController so that React StrictMode's double-invocation in
  // development (mount → unmount → remount) doesn't cause two concurrent
  // /auth/refresh calls. The first effect's cleanup aborts its fetch; the
  // second effect's call then succeeds cleanly.
  //
  // This also correctly resets on HMR reloads (unlike a module-level flag
  // which persists across HMR boundaries and prevented FINISH_LOADING from
  // ever being dispatched on hot reloads).

  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      try {
        if (!restorePromise) {
          restorePromise = api.post('/auth/refresh').finally(() => { restorePromise = null })
        }
        const { data } = await restorePromise

        if (cancelled) return   // StrictMode unmount — discard result

        if (!data.token) {
          throw new Error(data.error || 'No refresh token returned')
        }

        setAccessToken(data.token)
        scheduleProactiveRefresh(data.token)

        const profileRes = await api.get('/auth/profile')

        if (cancelled) return

        dispatch({
          type:    'LOGIN',
          payload: { ...profileRes.data, token: data.token },
        })
      } catch (err) {
        console.error('[AuthContext] Session restore failed:', err)
        if (!cancelled) clearAccessToken()
      } finally {
        if (!cancelled) dispatch({ type: 'FINISH_LOADING' })
      }
    }

    restoreSession()

    // Cleanup: mark as cancelled so async results from this effect are ignored
    return () => { cancelled = true }
  }, [])


  // ── Global session-expired handler ────────────────────────────
  // api.js fires 'auth:sessionExpired' when both the access token and
  // the refresh token are dead (e.g. cookie expired, reuse detected).
  useEffect(() => {
    const handleExpired = () => {
      cancelProactiveRefresh()
      clearAccessToken()
      dispatch({ type: 'LOGOUT' })
    }

    window.addEventListener('auth:sessionExpired', handleExpired)
    return () => window.removeEventListener('auth:sessionExpired', handleExpired)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, state, dispatch, scheduleProactiveRefresh, cancelProactiveRefresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}