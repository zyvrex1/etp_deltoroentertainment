
import api from './api'

export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);

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

export const updatePassword = (data, token) => API.put("/update-password", data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const forgotPassword = (email) => API.post("/forgot-password", { email });

// Payment Methods
export const addPaymentMethod = (data, token) => axios.post(`${BASE_URL}/api/user/payment-methods`, data, {
  headers: { Authorization: `Bearer ${token}` }
});

export const removePaymentMethod = (methodId, token) => axios.delete(`${BASE_URL}/api/user/payment-methods/${methodId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const setDefaultPaymentMethod = (methodId, token) => axios.put(`${BASE_URL}/api/user/payment-methods/${methodId}/default`, {}, {
  headers: { Authorization: `Bearer ${token}` }
});