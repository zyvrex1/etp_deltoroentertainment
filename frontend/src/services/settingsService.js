import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/settings`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getSettings = (token) => API.get('/', getAuthHeaders(token));
export const updateGeneral = (data, token) => API.put('/general', data, getAuthHeaders(token));
export const updateFees = (data, token) => API.put('/fees', data, getAuthHeaders(token));

export default {
  getSettings,
  updateGeneral,
  updateFees
};
