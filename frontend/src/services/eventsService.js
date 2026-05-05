const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/events`;

const eventsService = {
  /**
   * Fetch all events (role-based filtering happens on the backend)
   * @param {string} token - The authentication token
   * @returns {Promise<Array>} List of events
   */
  getEvents: async (token, status = "") => {
    try {
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const url = status ? `${API_URL}/?status=${status}` : `${API_URL}/`;
      const response = await fetch(url, {
        headers
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch events");
      }

      return json;
    } catch (error) {
      console.error("Error in getEvents service:", error);
      throw error;
    }
  },

  /**
   * Fetch a single event by ID
   * @param {string} id - The event ID
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The event object
   */
  getEvent: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch event");
      }

      return json;
    } catch (error) {
      console.error("Error in getEvent service:", error);
      throw error;
    }
  },

  /**
   * Create a new event
   * @param {FormData} formData - FormData containing event details and images
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The created event
   */
  createEvent: async (formData, token) => {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // No Content-Type header here for FormData; fetch sets it automatically with the boundary
        },
        body: formData
      });
      const json = await response.json();

      if (!response.ok) {
        const error = new Error(json.error || "Failed to create event");
        error.fields = json.fields;
        throw error;
      }

      return json;
    } catch (error) {
      console.error("Error in createEvent service:", error);
      throw error;
    }
  },

  /**
   * Update an existing event
   * @param {string} id - The event ID
   * @param {FormData|Object} updateData - FormData or JSON depending on if image is being updated
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The updated event
   */
  updateEvent: async (id, updateData, token) => {
    try {
      const isFormData = updateData instanceof FormData;
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(isFormData ? {} : { "Content-Type": "application/json" })
        },
        body: isFormData ? updateData : JSON.stringify(updateData)
      });
      const json = await response.json();

      if (!response.ok) {
        const error = new Error(json.error || "Failed to update event");
        error.fields = json.fields;
        throw error;
      }

      return json;
    } catch (error) {
      console.error("Error in updateEvent service:", error);
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {string} id - The event ID
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} Success message or deleted event
   */
  deleteEvent: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete event");
      }

      return json;
    } catch (error) {
      console.error("Error in deleteEvent service:", error);
      throw error;
    }
  },

  /**
   * Update seat map only
   * @param {string} id - The event ID
   * @param {Object} seatMap - The seat map data 
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} Success message and updated seat map
   */
  updateSeatMap: async (id, seatMap, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}/seatmap`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ seatMap })
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update seat map");
      }

      return json;
    } catch (error) {
      console.error("Error in updateSeatMap service:", error);
      throw error;
    }
  },
  /**
   * Customer purchases seats on the venue map
   * @param {string} id - Event ID
   * @param {string[]} seatIds - Array of layoutData item IDs for seats
   * @param {Object} amount - { total, subtotal, fee }
   * @param {string} token - Auth token
   */
  buySeats: async (id, seatIds, amount, billingInfo, paymentMethod, token) => {
    try {
      const response = await fetch(`${API_URL}/${id}/buy-seats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ seatIds, amount, billingInfo, paymentMethod }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to purchase seats");
      return json;
    } catch (error) {
      console.error("Error in buySeats service:", error);
      throw error;
    }
  },
};

export default eventsService;
