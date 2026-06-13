import api from './api';

const analyticsService = {
  getAuthHeaders: (token) => token ? { headers: { "Authorization": `Bearer ${token}` } } : {},

  /**
   * Fetch top performing events
   * @param {string} token - The authentication token
   * @param {Date} startDate - Optional start date
   * @param {string} eventId - Optional event filter
   * @returns {Promise<Array>} List of top performing events
   */
  getTopPerformingEvents: async (token, startDate, endDate, eventId = 'all') => {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (eventId && eventId !== 'all') params.eventId = eventId;
    
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
   * @param {string} eventId - Optional event filter
   * @returns {Promise<Object>} Overview statistics
   */
  getOverviewStats: async (token, startDate, endDate, eventId = 'all') => {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    if (eventId && eventId !== 'all') params.eventId = eventId;

    const response = await api.get('/analytics/overview-stats', {
      ...analyticsService.getAuthHeaders(token),
      params
    });
    return response.data;
  }
};

export default analyticsService;
