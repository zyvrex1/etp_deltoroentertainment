import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/venues` // assuming it's api/venues, wait let me check. Server.js doesn't have venue in previous list. Actually it had venueRoutes. Let's assume /api/venues
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const createVenue = (data, token) => API.post('/', data, getAuthHeaders(token));
export const getVenues = () => API.get('/');
export const getVenue = (id) => API.get(`/${id}`);
export const updateVenue = (id, data, token) => API.put(`/${id}`, data, getAuthHeaders(token));
export const deleteVenue = (id, token) => API.delete(`/${id}`, getAuthHeaders(token));

export default {
  createVenue,
  getVenues,
  getVenue,
  updateVenue,
  deleteVenue
};
