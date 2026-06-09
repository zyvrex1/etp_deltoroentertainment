import api from './api';

const concernService = {
  createConcern: async (concernData) => {
    const response = await api.post('/concerns', concernData);
    return response.data;
  },

  getMyConcerns: async () => {
    const response = await api.get('/concerns/my-concerns');
    return response.data;
  },

  getAdminConcerns: async () => {
    const response = await api.get('/concerns/admin');
    return response.data;
  },

  getAdminUnreadCount: async () => {
    const response = await api.get('/concerns/admin/unread-count');
    return response.data;
  },

  getConcernById: async (id) => {
    const response = await api.get(`/concerns/${id}`);
    return response.data;
  },

  addMessage: async (id, messageData) => {
    const response = await api.post(`/concerns/${id}/messages`, messageData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/concerns/${id}/status`, { status });
    return response.data;
  },

  updatePriority: async (id, priority) => {
    const response = await api.patch(`/concerns/${id}/priority`, { priority });
    return response.data;
  },

  assignConcern: async (id, adminId, adminName) => {
    const response = await api.patch(`/concerns/${id}/assign`, { adminId, adminName });
    return response.data;
  },

  addInternalNote: async (id, text) => {
    const response = await api.post(`/concerns/${id}/notes`, { text });
    return response.data;
  },

  updateInternalNote: async (id, noteId, text) => {
    const response = await api.patch(`/concerns/${id}/notes/${noteId}`, { text });
    return response.data;
  },

  deleteInternalNote: async (id, noteId) => {
    const response = await api.delete(`/concerns/${id}/notes/${noteId}`);
    return response.data;
  }
};

export default concernService;