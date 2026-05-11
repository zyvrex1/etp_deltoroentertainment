import api from './api';

const reservationService = {
  getAuthHeaders: (token) => ({
    headers: { Authorization: `Bearer ${token}` }
  }),

  getAdminReservations: async (token) => {
    const response = await api.get('/reservations/admin', reservationService.getAuthHeaders(token));
    return response.data;
  },

  getMyReservations: async (token) => {
    const response = await api.get('/reservations/my-booths', reservationService.getAuthHeaders(token));
    return response.data;
  },
  
  getEventBooths: async (eventId, token) => {
    const response = await api.get(`/reservations/event/${eventId}/booths`, reservationService.getAuthHeaders(token));
    return response.data;
  }
};

export default reservationService;
