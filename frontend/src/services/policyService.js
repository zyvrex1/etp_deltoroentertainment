const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/policies`;

const policyService = {
  /**
   * Fetch all policies
   * @returns {Promise<Array>} List of policies
   */
  getPolicies: async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch policies");
      }

      return json;
    } catch (error) {
      console.error("Error in getPolicies service:", error);
      throw error;
    }
  },

  /**
   * Fetch a single policy by its key (e.g., 'tos', 'privacy')
   * @param {string} policyKey 
   * @returns {Promise<Object>} The policy object
   */
  getPolicy: async (policyKey) => {
    try {
      const response = await fetch(`${API_URL}/${policyKey}/`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch policy");
      }

      return json;
    } catch (error) {
      console.error("Error in getPolicy service:", error);
      throw error;
    }
  },

  /**
   * Create a new policy
   * @param {Object} policyData { policyKey, title, content }
   * @param {string} token 
   * @returns {Promise<Object>} The created policy
   */
  createPolicy: async (policyData, token) => {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(policyData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to create policy");
      }

      return json;
    } catch (error) {
      console.error("Error in createPolicy service:", error);
      throw error;
    }
  },

  /**
   * Update an existing policy
   * @param {string} policyKey 
   * @param {Object} updateData { title, content }
   * @param {string} token 
   * @returns {Promise<Object>} The updated policy
   */
  updatePolicy: async (policyKey, updateData, token) => {
    try {
      const response = await fetch(`${API_URL}/${policyKey}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update policy");
      }

      return json;
    } catch (error) {
      console.error("Error in updatePolicy service:", error);
      throw error;
    }
  },

  /**
   * Delete a policy
   * @param {string} policyKey 
   * @param {string} token 
   * @returns {Promise<Object>} Success message
   */
  deletePolicy: async (policyKey, token) => {
    try {
      const response = await fetch(`${API_URL}/${policyKey}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete policy");
      }

      return json;
    } catch (error) {
      console.error("Error in deletePolicy service:", error);
      throw error;
    }
  }
};

export default policyService;
