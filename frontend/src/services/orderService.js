import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders/', orderData);
      return response.data;
    } catch (error) {
      console.error("Error in createOrder service:", error);
      throw error;
    }
  },

  getOrders: async (token, filters = {}) => {
    try {
      const response = await api.get('/orders/', { params: filters });
      // Return array for backwards compat
      const data = response.data;
      return data?.data || data;
    } catch (error) {
      console.error("Error in getOrders service:", error);
      throw error;
    }
  },

  getOrdersPaginated: async (token, params = {}) => {
    try {
      const response = await api.get('/orders/', { params });
      return response.data;
    } catch (error) {
      console.error("Error in getOrdersPaginated service:", error);
      throw error;
    }
  },

  updateOrder: async (id, updateData) => {
    try {
      const response = await api.patch(`/orders/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error in updateOrder service:", error);
      throw error;
    }
  }
};

export default orderService;