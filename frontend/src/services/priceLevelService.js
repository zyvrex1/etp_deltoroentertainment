const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/events`;

const priceLevelService = {
  /**
   * Fetch all price levels for an event
   * @param {string} eventId - The event ID
   * @param {string} token - The authentication token
   * @returns {Promise<Array>} List of price levels
   */
  getPriceLevels: async (eventId, token) => {
    try {
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const response = await fetch(`${API_URL}/${eventId}/price-levels`, {
        headers
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch price levels");
      }

      return json;
    } catch (error) {
      console.error("Error in getPriceLevels service:", error);
      throw error;
    }
  },

  /**
   * Add new price levels to an event
   * @param {string} eventId - The event ID
   * @param {Array} priceLevels - Array of price level objects
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The updated event
   */
  addPriceLevels: async (eventId, priceLevels, token) => {
    try {
      const response = await fetch(`${API_URL}/${eventId}/price-levels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ priceLevels })
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to add price levels");
      }

      return json;
    } catch (error) {
      console.error("Error in addPriceLevels service:", error);
      throw error;
    }
  },

  /**
   * Update a specific price level
   * @param {string} eventId - The event ID
   * @param {string} priceLevelId - The price level ID
   * @param {Object} updateData - Data to update
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The updated event
   */
  updatePriceLevel: async (eventId, priceLevelId, updateData, token) => {
    try {
      const response = await fetch(`${API_URL}/${eventId}/price-levels/${priceLevelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update price level");
      }

      return json;
    } catch (error) {
      console.error("Error in updatePriceLevel service:", error);
      throw error;
    }
  },

  /**
   * Delete a specific price level
   * @param {string} eventId - The event ID
   * @param {string} priceLevelId - The price level ID
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The updated event
   */
  deletePriceLevel: async (eventId, priceLevelId, token) => {
    try {
      const response = await fetch(`${API_URL}/${eventId}/price-levels/${priceLevelId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete price level");
      }

      return json;
    } catch (error) {
      console.error("Error in deletePriceLevel service:", error);
      throw error;
    }
  }
};

export default priceLevelService;
