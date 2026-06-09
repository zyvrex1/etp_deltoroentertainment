import api from './api';

const authHeaders = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

const payoutService = {
  createPayout: async (payoutData, token) => {
    const response = await api.post('/payouts', payoutData, authHeaders(token));
    return response.data;
  },

  getPayouts: async (token) => {
    const response = await api.get('/payouts', authHeaders(token));
    return response.data;
  },

  updatePayoutStatus: async (payoutId, status, rejectionReason, token) => {
    const response = await api.patch(
      `/payouts/${payoutId}/status`,
      { status, rejectionReason },
      authHeaders(token)
    );
    return response.data;
  }
};

export default payoutService;