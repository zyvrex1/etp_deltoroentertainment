import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/user`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getPromoters = (token) => API.get('/promoters', getAuthHeaders(token));
export const getUserById = (id, token) => API.get(`/${id}`, getAuthHeaders(token));
export const updateProfile = (data, token) => API.put('/profile', data, {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
export const updateSecurity = (data, token) => API.put('/security', data, getAuthHeaders(token));
export const updateNotifications = (data, token) => API.put('/notifications', data, getAuthHeaders(token));
export const updateCart = (cart, token) => API.put('/cart', { cart }, getAuthHeaders(token));

export default {
  getPromoters,
  getUserById,
  updateProfile,
  updateSecurity,
  updateNotifications,
  updateCart
};
