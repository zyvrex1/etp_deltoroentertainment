import api from './api';

const payoutService = {
  createPayout: async (payoutData) => {
    const response = await api.post('/payouts', payoutData);
    return response.data;
  },

  getPayouts: async () => {
    const response = await api.get('/payouts');
    return response.data;
  },

  updatePayoutStatus: async (payoutId, status, rejectionReason) => {
    const response = await api.patch(`/payouts/${payoutId}/status`, { status, rejectionReason });
    return response.data;
  }
};

export default payoutService;