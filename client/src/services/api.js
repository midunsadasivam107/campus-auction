import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear, actionable error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    let message = data?.error || error.message || 'Something went wrong';

    // If backend returns field-level details, extract and display them directly
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      message = data.details.map((d) => d.message).join('. ');
    }

    if (error.response && error.response.data) {
      error.response.data.error = message;
    }

    return Promise.reject(error);
  }
);

export default api;
