import api from './api';

const priceLevelService = {
  getPriceLevels: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/price-levels`);
      return response.data;
    } catch (error) {
      console.error("Error in getPriceLevels service:", error);
      throw error;
    }
  },

  addPriceLevels: async (eventId, priceLevels) => {
    try {
      const response = await api.post(`/events/${eventId}/price-levels`, { priceLevels });
      return response.data;
    } catch (error) {
      console.error("Error in addPriceLevels service:", error);
      throw error;
    }
  },

  updatePriceLevel: async (eventId, priceLevelId, updateData) => {
    try {
      const response = await api.patch(`/events/${eventId}/price-levels/${priceLevelId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error in updatePriceLevel service:", error);
      throw error;
    }
  },

  deletePriceLevel: async (eventId, priceLevelId) => {
    try {
      const response = await api.delete(`/events/${eventId}/price-levels/${priceLevelId}`);
      return response.data;
    } catch (error) {
      console.error("Error in deletePriceLevel service:", error);
      throw error;
    }
  }
};

export default priceLevelService;