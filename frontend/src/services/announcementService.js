import api from './api';

const announcementService = {
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/');
      return response.data;
    } catch (error) {
      console.error("Error in getAnnouncements service:", error);
      throw error;
    }
  },

  createAnnouncement: async (announcementData) => {
    try {
      const response = await api.post('/announcements/', announcementData);
      return response.data;
    } catch (error) {
      console.error("Error in createAnnouncement service:", error);
      throw error;
    }
  },

  updateAnnouncement: async (id, updateData) => {
    try {
      const response = await api.patch(`/announcements/${id}/`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error in updateAnnouncement service:", error);
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      const response = await api.delete(`/announcements/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteAnnouncement service:", error);
      throw error;
    }
  }
};

export default announcementService;