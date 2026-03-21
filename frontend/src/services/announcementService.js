const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

const API_URL = `${BASE_URL}/api/announcements`;

const announcementService = {
  /**
   * Fetch all announcements
   * @returns {Promise<Array>} List of announcements
   */
  getAnnouncements: async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch announcements");
      }

      return json;
    } catch (error) {
      console.error("Error in getAnnouncements service:", error);
      throw error;
    }
  },

  /**
   * Create a new announcement
   * @param {Object} announcementData 
   * @param {string} token 
   * @returns {Promise<Object>} Created announcement
   */
  createAnnouncement: async (announcementData, token) => {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(announcementData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to create announcement");
      }

      return json;
    } catch (error) {
      console.error("Error in createAnnouncement service:", error);
      throw error;
    }
  },

  /**
   * Update an existing announcement
   * @param {string} id 
   * @param {Object} updateData 
   * @param {string} token 
   * @returns {Promise<Object>} Updated announcement
   */
  updateAnnouncement: async (id, updateData, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update announcement");
      }

      return json;
    } catch (error) {
      console.error("Error in updateAnnouncement service:", error);
      throw error;
    }
  },

  /**
   * Delete an announcement
   * @param {string} id 
   * @param {string} token 
   * @returns {Promise<Object>} Success message
   */
  deleteAnnouncement: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete announcement");
      }

      return json;
    } catch (error) {
      console.error("Error in deleteAnnouncement service:", error);
      throw error;
    }
  }
};

export default announcementService;
