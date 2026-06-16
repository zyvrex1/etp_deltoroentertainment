import api from './api';

const authHeaders = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

const adminService = {
  getUsers: async (token, params = {}) => {
    try {
      const response = await api.get('/admin/users', { ...authHeaders(token), params });
      return response.data;
    } catch (error) {
      console.error("Error in getUsers service:", error);
      throw error;
    }
  },

  updateUser: async (id, data, token) => {
    try {
      const response = await api.patch(`/admin/users/${id}`, data, authHeaders(token));
      return response.data;
    } catch (error) {
      console.error("Error in updateUser service:", error);
      throw error;
    }
  },

  deleteUser: async (id, token) => {
    try {
      const response = await api.delete(`/admin/users/${id}`, authHeaders(token));
      return response.data;
    } catch (error) {
      console.error("Error in deleteUser service:", error);
      throw error;
    }
  }
};

export default adminService;