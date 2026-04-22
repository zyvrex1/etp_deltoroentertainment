const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/reservations`;

const reservationService = {
  /**
   * Fetch all reservations for admin view
   * @param {string} token - The authentication token
   * @returns {Promise<Array>} List of reservations
   */
  getAdminReservations: async (token) => {
    try {
      const response = await fetch(`${API_URL}/admin`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch reservations");
      }

      return json;
    } catch (error) {
      console.error("Error in getAdminReservations service:", error);
      throw error;
    }
  }
};

export default reservationService;
