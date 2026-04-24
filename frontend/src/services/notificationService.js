import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const API = axios.create({
  baseURL: `${BASE_URL}/api/notifications`
});

const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getNotifications = (token) => API.get('/', getAuthHeaders(token));
export const markAllAsRead = (token) => API.patch('/read-all', {}, getAuthHeaders(token));
export const markAsRead = (id, token) => API.patch(`/${id}/read`, {}, getAuthHeaders(token));

export default {
  getNotifications,
  markAllAsRead,
  markAsRead
};
