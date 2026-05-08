import api from './api';

const analyticsService = {
  getAuthHeaders: (token) => token ? { headers: { "Authorization": `Bearer ${token}` } } : {},

  /**
   * Fetch top performing events
   * @param {string} token - The authentication token
   * @returns {Promise<Array>} List of top performing events
   */
  getTopPerformingEvents: async (token) => {
    const response = await api.get('/analytics/top-performing-events', analyticsService.getAuthHeaders(token));
    return response.data;
  },

  /**
   * Fetch overview statistics
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} Overview statistics
   */
  getOverviewStats: async (token) => {
    const response = await api.get('/analytics/overview-stats', analyticsService.getAuthHeaders(token));
    return response.data;
  }
};

export default analyticsService;
