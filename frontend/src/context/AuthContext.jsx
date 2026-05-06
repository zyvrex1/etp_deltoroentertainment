import { createContext, useReducer, useEffect } from "react";
import axios from "axios";

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

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true, // add loading flag
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))

    if (user) {
      dispatch({ type: 'LOGIN', payload: user })
    }

    dispatch({ type: 'FINISH_LOADING' })
  }, [])

  return (
    <AuthContext.Provider value={{...state, dispatch}}>
      {children}
    </AuthContext.Provider>
  )
}