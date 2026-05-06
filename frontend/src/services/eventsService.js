import api from './api';

const eventsService = {
  getAuthHeaders: (token) => token ? { headers: { "Authorization": `Bearer ${token}` } } : {},

  getEvents: async (token, status = "") => {
    const url = status ? `/events/?status=${status}` : `/events/`;
    const response = await api.get(url, eventsService.getAuthHeaders(token));
    return response.data;
  },

  getEvent: async (id, token) => {
    const response = await api.get(`/events/${id}`, eventsService.getAuthHeaders(token));
    return response.data;
  },

  createEvent: async (formData, token) => {
    const response = await api.post('/events/', formData, eventsService.getAuthHeaders(token));
    return response.data;
  },

  updateEvent: async (id, updateData, token) => {
    const response = await api.patch(`/events/${id}`, updateData, eventsService.getAuthHeaders(token));
    return response.data;
  },

  deleteEvent: async (id, token) => {
    const response = await api.delete(`/events/${id}`, eventsService.getAuthHeaders(token));
    return response.data;
  },

  updateSeatMap: async (id, seatMap, token) => {
    const response = await api.patch(`/events/${id}/seatmap`, { seatMap }, eventsService.getAuthHeaders(token));
    return response.data;
  },

  buySeats: async (id, seatIds, amount, billingInfo, paymentMethod, token) => {
    const response = await api.post(`/events/${id}/buy-seats`, { seatIds, amount, billingInfo, paymentMethod }, eventsService.getAuthHeaders(token));
    return response.data;
  },
};

export default eventsService;
