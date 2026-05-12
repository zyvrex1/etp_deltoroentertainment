import api from './api';

const analyticsService = {
  getAuthHeaders: (token) => token ? { headers: { "Authorization": `Bearer ${token}` } } : {},

  /**
   * Fetch top performing events
   * @param {string} token - The authentication token
   * @param {Date} startDate - Optional start date
   * @param {Date} endDate - Optional end date
   * @returns {Promise<Array>} List of top performing events
   */
  getTopPerformingEvents: async (token, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    
    const response = await api.get('/analytics/top-performing-events', {
      ...analyticsService.getAuthHeaders(token),
      params
    });
    return response.data;
  },

  /**
   * Fetch overview statistics
   * @param {string} token - The authentication token
   * @param {Date} startDate - Optional start date
   * @param {Date} endDate - Optional end date
   * @returns {Promise<Object>} Overview statistics
   */
  getOverviewStats: async (token, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get('/analytics/overview-stats', {
      ...analyticsService.getAuthHeaders(token),
      params
    });
    return response.data;
  }
};

export default analyticsService;
