import { createContext, useReducer, useEffect } from "react";

export const AuthContext = createContext()

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload }
    case 'LOGOUT':
      return { ...state, user: null }
    case 'FINISH_LOADING':
      return { ...state, loading: false }
    default:
      return state
  }
}

// ✅ Helper: check if JWT is expired without a library
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now()
  } catch {
    return true // malformed token = treat as expired
  }
}

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const user = JSON.parse(raw)
        // ✅ Only restore if token exists and hasn't expired
        if (user?.token && !isTokenExpired(user.token)) {
          dispatch({ type: 'LOGIN', payload: user })
        } else {
          // Token expired — clean up silently, no redirect here
          localStorage.removeItem('user')
        }
      }
    } catch {
      localStorage.removeItem('user') // corrupted JSON
    }

    dispatch({ type: 'FINISH_LOADING' })
  }, [])

  return (
    <AuthContext.Provider value={{...state, dispatch}}>
      {children}
    </AuthContext.Provider>
  )
}