import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returned an error response
    if (error.response && error.response.data) {
      return Promise.reject({
        ...error.response.data,
        status: error.response.status,
        isNetworkError: false,
      });
    }
    return Promise.reject({
      success: false,
      status: error.response ? error.response.status : 0,
      isNetworkError: !error.response,
      message: !error.response
        ? 'Cannot connect to warehouse server. Please ensure the backend server is running on port 5000.'
        : error.message || 'Network error or server unreachable.',
    });
  }
);

export default api;
