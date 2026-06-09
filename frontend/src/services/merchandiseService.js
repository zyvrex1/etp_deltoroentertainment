import api from './api';

const merchandiseService = {
  getMerchandises: async (token, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/merchandise/?${queryParams}` : '/merchandise/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error in getMerchandises service:", error);
      throw error;
    }
  },

  getMerchandise: async (id) => {
    try {
      const response = await api.get(`/merchandise/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in getMerchandise service:", error);
      throw error;
    }
  },

  createMerchandise: async (merchandiseData) => {
    try {
      const response = await api.post('/merchandise/', merchandiseData);
      return response.data;
    } catch (error) {
      console.error("Error in createMerchandise service:", error);
      throw error;
    }
  },

  updateMerchandise: async (id, updateData) => {
    try {
      const response = await api.patch(`/merchandise/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error in updateMerchandise service:", error);
      throw error;
    }
  },

  deleteMerchandise: async (id) => {
    try {
      const response = await api.delete(`/merchandise/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteMerchandise service:", error);
      throw error;
    }
  }
};

export default merchandiseService;