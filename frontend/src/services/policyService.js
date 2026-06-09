import api from './api';

const policyService = {
  getPolicies: async () => {
    try {
      const response = await api.get('/policies/');
      return response.data;
    } catch (error) {
      console.error("Error in getPolicies service:", error);
      throw error;
    }
  },

  getPolicy: async (policyKey) => {
    try {
      const response = await api.get(`/policies/${policyKey}/`);
      return response.data;
    } catch (error) {
      console.error("Error in getPolicy service:", error);
      throw error;
    }
  },

  createPolicy: async (policyData) => {
    try {
      const response = await api.post('/policies/', policyData);
      return response.data;
    } catch (error) {
      console.error("Error in createPolicy service:", error);
      throw error;
    }
  },

  updatePolicy: async (policyKey, updateData) => {
    try {
      const response = await api.put(`/policies/${policyKey}/`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error in updatePolicy service:", error);
      throw error;
    }
  },

  deletePolicy: async (policyKey) => {
    try {
      const response = await api.delete(`/policies/${policyKey}/`);
      return response.data;
    } catch (error) {
      console.error("Error in deletePolicy service:", error);
      throw error;
    }
  }
};

export default policyService;