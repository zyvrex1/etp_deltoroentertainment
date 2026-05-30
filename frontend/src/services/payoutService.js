const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const payoutService = {
  createPayout: async (payoutData, token) => {
    const response = await fetch(`${BASE_URL}/api/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payoutData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payout');
    }
    return response.json();
  },

  getPayouts: async (token) => {
    const response = await fetch(`${BASE_URL}/api/payouts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payouts');
    }
    return response.json();
  },

  updatePayoutStatus: async (payoutId, status, rejectionReason, token) => {
    const response = await fetch(`${BASE_URL}/api/payouts/${payoutId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, rejectionReason })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update payout status');
    }
    return response.json();
  }
};

export default payoutService;
