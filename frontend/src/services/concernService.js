const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/concerns`;

const concernService = {
  createConcern: async (concernData, token) => {
    const isFormData = concernData instanceof FormData;
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: isFormData ? concernData : JSON.stringify(concernData)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  getMyConcerns: async (token) => {
    const response = await fetch(`${API_URL}/my-concerns`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  getAdminConcerns: async (token) => {
    const response = await fetch(`${API_URL}/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  getAdminUnreadCount: async (token) => {
    const response = await fetch(`${API_URL}/admin/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  getConcernById: async (id, token) => {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  addMessage: async (id, messageData, token) => {
    const isFormData = messageData instanceof FormData;
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_URL}/${id}/messages`, {
      method: 'POST',
      headers,
      body: isFormData ? messageData : JSON.stringify(messageData)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  updateStatus: async (id, status, token) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },
  
  updatePriority: async (id, priority, token) => {
    const response = await fetch(`${API_URL}/${id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ priority })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  assignConcern: async (id, adminId, adminName, token) => {
    const response = await fetch(`${API_URL}/${id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ adminId, adminName })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  addInternalNote: async (id, text, token) => {
    const response = await fetch(`${API_URL}/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  updateInternalNote: async (id, noteId, text, token) => {
    const response = await fetch(`${API_URL}/${id}/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  },

  deleteInternalNote: async (id, noteId, token) => {
    const response = await fetch(`${API_URL}/${id}/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json;
  }
};

export default concernService;
