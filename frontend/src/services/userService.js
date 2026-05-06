import api from './api';

const API = {
  get: (url, config) => api.get(`/user${url}`, config),
  put: (url, data, config) => api.put(`/user${url}`, data, config),
};

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// No longer need separate interceptor here as it's in api.js

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
