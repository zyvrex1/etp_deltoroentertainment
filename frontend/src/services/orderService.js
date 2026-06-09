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
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/orders/?${queryParams}` : '/orders/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error in getOrders service:", error);
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