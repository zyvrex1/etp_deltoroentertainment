const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/orders`;

const orderService = {
    createOrder: async (orderData, token) => {
        try {
            const response = await fetch(`${API_URL}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Failed to create order");
            return json;
        } catch (error) {
            console.error("Error in createOrder service:", error);
            throw error;
        }
    },

    getOrders: async (token, filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `${API_URL}/?${queryParams}` : `${API_URL}/`;
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};
            const response = await fetch(url, { headers });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Failed to fetch orders");
            return json;
        } catch (error) {
            console.error("Error in getOrders service:", error);
            throw error;
        }
    },

    updateOrder: async (id, updateData, token) => {
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
            if (!response.ok) throw new Error(json.error || "Failed to update order");
            return json;
        } catch (error) {
            console.error("Error in updateOrder service:", error);
            throw error;
        }
    }
};

export default orderService;
