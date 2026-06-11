
import api from './api'

export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);

export const getProfile = () =>

  api.get("/auth/profile")

export const updateProfile =

  (formData) =>

    api.put("/user/profile",
      formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

export const updatePassword = (data, token) => api.put("/auth/update-password", data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });

// Payment Methods
export const addPaymentMethod = (data, token) => api.post("/user/payment-methods", data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const removePaymentMethod = (methodId, token) => api.delete(`/user/payment-methods/${methodId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const setDefaultPaymentMethod = (methodId, token) => api.put(`/user/payment-methods/${methodId}/default`, {}, {
  headers: { Authorization: `Bearer ${token}` }
});