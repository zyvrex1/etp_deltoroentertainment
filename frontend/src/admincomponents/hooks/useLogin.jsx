import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useLogin = () => {
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const { dispatch } = useAuthContext()

    const login = async (email, password, role) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            })

            const data = await response.json()

            if (!response.ok) {
                // Extracts only the error message instead of the whole JSON object string
                throw new Error(data.error || 'Login failed')
            }
            
            // Check if the user's role matches the selected portal role (redundancy for safety)
            if (role && data.role !== role) {
                throw new Error(`This account is authorized for ${data.role} access only.`);
            }

            localStorage.setItem('user', JSON.stringify(data))
            dispatch({ type: 'LOGIN', payload: data })
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return { login, isLoading, error }
}