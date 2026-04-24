import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/superadmin`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const createUser = (data, token) => API.post('/create-user', data, getAuthHeaders(token));
export const getAllUsers = (token) => API.get('/users', getAuthHeaders(token));
export const getUser = (id, token) => API.get(`/users/${id}`, getAuthHeaders(token));
export const updateUser = (id, data, token) => API.patch(`/users/${id}`, data, getAuthHeaders(token));
export const deleteUser = (id, token) => API.delete(`/users/${id}`, getAuthHeaders(token));

export default {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
};
