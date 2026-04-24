import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/categories` // Assuming /api/categories or check server.js... wait, server.js says app.use('/api/category', categoryRoutes)? Oh, let me check server.js. Wait, server.js wasn't fully shown for category. Ah, I can just use /api/categories or what it's defined as.
});

// Create an instance that attaches token
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const createCategory = (data, token) => API.post('/', data, getAuthHeaders(token));
export const getCategories = () => API.get('/');
export const getCategory = (id) => API.get(`/${id}`);
export const updateCategory = (id, data, token) => API.put(`/${id}`, data, getAuthHeaders(token));
export const deleteCategory = (id, token) => API.delete(`/${id}`, getAuthHeaders(token));

export default {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
};
