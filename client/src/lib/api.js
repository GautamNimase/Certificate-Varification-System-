// client/src/lib/api.js - Centralized API utility
const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isProd ? 'https://certificate-varification-system-backend.onrender.com/api' : 'http://localhost:5000/api');

console.log('[API] Using base URL:', API_BASE_URL);

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.json();
  },

  post: async (endpoint, data, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  upload: async (endpoint, formData, token = null) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    return response.json();
  },

  download: async (endpoint, token = null) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers
    });
    return response.blob();
  }
};

export default api;
