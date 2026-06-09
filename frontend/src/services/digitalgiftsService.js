import api from './api';

const digitalgiftsService = {
  getGifts: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `/digital-gifts${query ? `?${query}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get('/digital-gifts/stats');
    return response.data.data;
  },

  createGift: async (giftData) => {
    const response = await api.post('/digital-gifts', giftData);
    return response.data.data;
  },

  updateGift: async (giftId, giftData) => {
    const response = await api.put(`/digital-gifts/${giftId}`, giftData);
    return response.data.data;
  },

  deleteGift: async (giftId) => {
    const response = await api.delete(`/digital-gifts/${giftId}`);
    return response.data;
  },

  assignGift: async (giftId, assignmentData) => {
    const response = await api.post(`/digital-gifts/${giftId}/assign`, assignmentData);
    return response.data.data;
  },

  getRecentAssignments: async (limit = 20) => {
    const response = await api.get(`/digital-gifts/assignments/recent?limit=${limit}`);
    return response.data.data;
  },

  getMyGifts: async () => {
    const response = await api.get('/digital-gifts/my-gifts');
    return response.data.data;
  },

  redeemByCode: async (code) => {
    const response = await api.post('/digital-gifts/redeem-by-code', { code });
    return response.data.data;
  },

  redeemAssignment: async (giftId, assignmentId) => {
    const response = await api.patch(`/digital-gifts/${giftId}/assignments/${assignmentId}/redeem`);
    return response.data.data;
  }
};

export default digitalgiftsService;