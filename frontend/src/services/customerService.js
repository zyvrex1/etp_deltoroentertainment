import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/customer`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getCustomerDashboard = (token) => API.get('/customerdashboard', getAuthHeaders(token));

export default {
  getCustomerDashboard
};
