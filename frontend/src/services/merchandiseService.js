const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/merchandise`;

const merchandiseService = {
  /**
   * Fetch all merchandise with optional filters
   * @param {string} token - Auth token
   * @param {Object} filters - Filter object (eventId, category, status, sponsorId)
   * @returns {Promise<Array>} List of merchandise
   */
  getMerchandises: async (token, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `${API_URL}/?${queryParams}` : `${API_URL}/`;
      
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch merchandises");
      }

      return json;
    } catch (error) {
      console.error("Error in getMerchandises service:", error);
      throw error;
    }
  },

  /**
   * Fetch a single merchandise item
   * @param {string} id - Merchandise ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} The merchandise item
   */
  getMerchandise: async (id, token) => {
    try {
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const response = await fetch(`${API_URL}/${id}`, { headers });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch merchandise");
      }

      return json;
    } catch (error) {
      console.error("Error in getMerchandise service:", error);
      throw error;
    }
  },

  /**
   * Create new merchandise
   * @param {Object} merchandiseData - Data for the new merchandise
   * @param {string} token - Auth token
   * @returns {Promise<Object>} The created merchandise
   */
  createMerchandise: async (merchandiseData, token) => {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(merchandiseData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to create merchandise");
      }

      return json;
    } catch (error) {
      console.error("Error in createMerchandise service:", error);
      throw error;
    }
  },

  /**
   * Update merchandise
   * @param {string} id - Merchandise ID
   * @param {Object} updateData - Data to update
   * @param {string} token - Auth token
   * @returns {Promise<Object>} The updated merchandise
   */
  updateMerchandise: async (id, updateData, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update merchandise");
      }

      return json;
    } catch (error) {
      console.error("Error in updateMerchandise service:", error);
      throw error;
    }
  },

  /**
   * Delete merchandise
   * @param {string} id - Merchandise ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Result message
   */
  deleteMerchandise: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete merchandise");
      }

      return json;
    } catch (error) {
      console.error("Error in deleteMerchandise service:", error);
      throw error;
    }
  }
};

export default merchandiseService;
