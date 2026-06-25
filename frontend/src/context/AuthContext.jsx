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
      return { ...state, user: null }
    case 'FINISH_LOADING':
      return { ...state, loading: false }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
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
  useEffect(() => {
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
    <AuthContext.Provider value={{ ...state, dispatch, scheduleProactiveRefresh, cancelProactiveRefresh }}>
      {children}
    </AuthContext.Provider>
  )
}