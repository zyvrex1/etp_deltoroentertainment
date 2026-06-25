import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,   // ← sends the HttpOnly refresh cookie on every request
})

// ─── Token store (in-memory — never touches localStorage) ─────
// AuthContext writes here after login/restore; interceptor reads it.
let _accessToken = null

export const setAccessToken  = (token) => { _accessToken = token }
export const getAccessToken  = ()      => _accessToken
export const clearAccessToken = ()     => { _accessToken = null }

// ─── Request interceptor ──────────────────────────────────────
// Attaches the in-memory access token to every outgoing request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

// ─── Response interceptor ─────────────────────────────────────
// On 401: attempt a silent token refresh, then replay the original request.
// On second 401: the refresh itself failed → force logout.

let isRefreshing     = false
let refreshQueue     = []   // pending requests waiting for the new token

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status   = error.response?.status
    const url      = original?.url || ''

    // Don't retry refresh/login/signup/logout routes — those 401s are real
    const isAuthRoute = [
      '/auth/refresh',
      '/auth/login',
      '/auth/signup',
      '/auth/logout',
      '/auth/forgot-password',
    ].some((path) => url.includes(path))

    if (status !== 401 || isAuthRoute || original._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry  = true
    isRefreshing     = true

    try {
      // Cookie is sent automatically (withCredentials: true)
      const { data } = await api.post('/auth/refresh')
      const newToken  = data.token

      setAccessToken(newToken)
      original.headers.Authorization = `Bearer ${newToken}`

      processQueue(null, newToken)
      return api(original)

    } catch (refreshError) {
      // Refresh failed — session is truly dead
      processQueue(refreshError, null)
      clearAccessToken()

      // Dispatch a global event so AuthContext can clean up React state
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'))

      return Promise.reject(refreshError)

    } finally {
      isRefreshing = false
    }
  }
)

export default api