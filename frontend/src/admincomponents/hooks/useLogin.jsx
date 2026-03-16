import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useLogin = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const { dispatch } = useAuthContext()

    const login = async (email, password) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            let data;
            if (response.ok) {
                data = await response.json()
                localStorage.setItem('user', JSON.stringify(data))
                dispatch({ type: 'LOGIN', payload: data })
            } else {
                // safely handle non-JSON or empty responses
                const text = await response.text()
                throw new Error(text || 'Login failed')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return { login, isLoading, error }
}