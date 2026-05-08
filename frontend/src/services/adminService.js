const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/admin`;

const adminService = {
  /**
   * Fetch all users
   * @param {string} token - The authentication token
   * @returns {Promise<Array>} List of users
   */
  getUsers: async (token) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch users");
      }

      return json;
    } catch (error) {
      console.error("Error in getUsers service:", error);
      throw error;
    }
  },

  /**
   * Update a user
   * @param {string} id - The user ID
   * @param {Object} data - The data to update
   * @param {string} token - The authentication token
   * @returns {Promise<Object>} The updated user
   */
  updateUser: async (id, data, token) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update user");
      }

      return json;
    } catch (error) {
      console.error("Error in updateUser service:", error);
      throw error;
    }
  }
};

export default adminService;
