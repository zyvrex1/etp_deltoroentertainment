import { useState } from 'react'
import { useAuthContext } from './useAuthContext'
import api, { setAccessToken } from '../services/api'

export const useLogin = () => {
  const [error, setError]       = useState(null)
  const [isLoading, setLoading] = useState(false)
  const { dispatch, scheduleProactiveRefresh } = useAuthContext()  // ✅

  const login = async (email, password, role) => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.post('/auth/login', { email, password, role })

      if (role && data.role !== role) {
        throw new Error(`This account is authorized for ${data.role} access only.`)
      }

      setAccessToken(data.token)
      dispatch({ type: 'LOGIN', payload: data })
      scheduleProactiveRefresh(data.token)  // ✅ start timer on fresh login

    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return { login, isLoading, error }
}