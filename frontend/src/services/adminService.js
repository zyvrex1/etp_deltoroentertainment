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
  }
};

export default adminService;
