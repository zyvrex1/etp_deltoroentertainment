import { useState } from 'react'
import { useAuthContext } from './useAuthContext'
import api from '../services/api'  // ← import your axios instance

export const useLogin = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const { dispatch } = useAuthContext()

    const login = async (email, password, role) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.post('/auth/login', { email, password, role })
            const data = response.data

            // Check if the user's role matches the selected portal role
            if (role && data.role !== role) {
                throw new Error(`This account is authorized for ${data.role} access only.`)
            }

            localStorage.setItem('user', JSON.stringify(data))
            dispatch({ type: 'LOGIN', payload: data })

        } catch (err) {
            // axios wraps errors differently — extract the message correctly
            const message = err.response?.data?.error || err.message || 'Login failed'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    return { login, isLoading, error }
}