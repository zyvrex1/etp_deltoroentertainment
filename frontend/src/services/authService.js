
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

export const updatePassword = (data) => api.put("/auth/update-password", data);

export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });

// Payment Methods
export const addPaymentMethod = (data) => api.post("/user/payment-methods", data);

export const removePaymentMethod = (methodId) => api.delete(`/user/payment-methods/${methodId}`);

export const setDefaultPaymentMethod = (methodId) => api.put(`/user/payment-methods/${methodId}/default`, {});