import { useState } from 'react'
import { useAuthContext } from './useAuthContext'
import api, { setAccessToken } from '../services/api'

export const useLogin = () => {
  const [error, setError]       = useState(null)
  const [isLoading, setLoading] = useState(false)
  const { dispatch, scheduleProactiveRefresh } = useAuthContext()

  /**
   * Attempts to log the user in.
   *
   * Returns an object so the caller (Login.jsx) can react to lockout state:
   *   { locked: true, remainingMs: number }  — account is locked
   *   { locked: false }                       — successful login (user dispatched)
   *
   * On a lockout response (HTTP 423) the server sends:
   *   { error: "...", remainingMs: <ms until unlock> }
   *
   * The hook surfaces remainingMs to the component so it can start a
   * countdown without needing to hard-code the lock duration on the client.
   */
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
      scheduleProactiveRefresh(data.token)

      return { locked: false }

    } catch (err) {
      // ── Step 27: detect the 423 Locked status ─────────────────
      if (err.response?.status === 423) {
        const message     = err.response.data?.error || 'Account temporarily locked.'
        const remainingMs = err.response.data?.remainingMs || 15 * 60 * 1000
        setError(message)
        return { locked: true, remainingMs }
      }

      const message = err.response?.data?.error || err.message || 'Login failed'
      setError(message)
      return { locked: false }

    } finally {
      setLoading(false)
    }
  }

  return { login, isLoading, error }
}