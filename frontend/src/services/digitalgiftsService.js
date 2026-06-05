const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const digitalgiftsService = {
  getGifts: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/digital-gifts${query ? `?${query}` : ""}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch digital gifts');
    }
    return result.data; // The controller returns { success: true, data: [...] }
  },

  getStats: async (token) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch gift stats');
    }
    return result.data;
  },

  createGift: async (giftData, token) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(giftData)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create digital gift');
    }
    return result.data;
  },

  updateGift: async (giftId, giftData, token) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts/${giftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(giftData)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update digital gift');
    }
    return result.data;
  },

  deleteGift: async (giftId, token) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts/${giftId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete digital gift');
    }
    return result;
  },

  assignGift: async (giftId, assignmentData, token) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts/${giftId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(assignmentData)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to assign digital gift');
    }
    return result.data;
  },

  getRecentAssignments: async (token, limit = 20) => {
    const response = await fetch(`${BASE_URL}/api/digital-gifts/assignments/recent?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch recent assignments');
    }
    return result.data;
  }
};

export default digitalgiftsService;
