import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`
});

// Attach token from localStorage on every request
// Handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/forgot-password');

    if (status === 401 && !isAuthRoute) {
      // ✅ Only logout if localStorage actually has a user
      // This prevents firing during the login dispatch window
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          // ✅ Double-check: only redirect if token is truly expired
          const payload = JSON.parse(atob(user.token.split('.')[1]));
          const expired = payload.exp * 1000 < Date.now();
          if (expired) {
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?error=session_expired';
            }
          }
          // If token is NOT expired but still got 401 → let the
          // component handle it (wrong role, deleted user, etc.)
        } catch {
          localStorage.removeItem('user');
        }
      }
    }

    return Promise.reject(error);
  }
);
export default api;