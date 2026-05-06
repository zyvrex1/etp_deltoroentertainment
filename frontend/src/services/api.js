import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`
});

// Interceptor to handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
