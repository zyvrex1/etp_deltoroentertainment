import api from './api';

const adminService = {
  getUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error("Error in getUsers service:", error);
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await api.patch(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error in updateUser service:", error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteUser service:", error);
      throw error;
    }
  }
};

export default adminService;