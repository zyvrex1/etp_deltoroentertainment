import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const API = axios.create({
  baseURL: `${BASE_URL}/api/auth`
});

export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);

export const getProfile = (token) => API.get("/profile", {
  headers: { Authorization: `Bearer ${token}` }
});

export const updateProfile = (formData, token) => axios.put(`${BASE_URL}/api/user/profile`, formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});

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