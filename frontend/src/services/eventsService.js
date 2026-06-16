import api from './api';

const eventsService = {
  getAuthHeaders: (token) => token ? { headers: { "Authorization": `Bearer ${token}` } } : {},

  getEvents: async (token, params = {}) => {
    // If a string was passed for legacy 'status' param, migrate it
    if (typeof params === 'string') {
      params = { status: params };
    }
    const response = await api.get('/events/', { ...eventsService.getAuthHeaders(token), params });
    // Always return an array for backwards compatibility
    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  },

  // Use this for paginated table views — returns { data, pagination, counts }
  getEventsPaginated: async (token, params = {}) => {
    const response = await api.get('/events/', { ...eventsService.getAuthHeaders(token), params });
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

  buySeats: async (id, seatIds, amount, billingInfo, paymentMethod, token, giftInfo = null) => {
    const payload = { seatIds, amount, billingInfo, paymentMethod };
    if (giftInfo) {
      payload.giftCode = giftInfo.giftCode;
      payload.appliedGift = giftInfo.appliedGift;
    }
    const response = await api.post(`/events/${id}/buy-seats`, payload, eventsService.getAuthHeaders(token));
    return response.data;
  },
};

export default eventsService;
