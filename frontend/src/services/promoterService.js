import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/promoter`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getPromoterDashboard = (token) => API.get('/promoterdashboard', getAuthHeaders(token));

export default {
  getPromoterDashboard
};
