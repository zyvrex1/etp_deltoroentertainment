import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/sponsor`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getSponsorDashboard = (token) => API.get('/sponsordashboard', getAuthHeaders(token));

export default {
  getSponsorDashboard
};
