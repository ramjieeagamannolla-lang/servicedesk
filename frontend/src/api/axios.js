import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sdp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sdp_token');
      localStorage.removeItem('sdp_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Normalizes any axios error into a friendly, displayable message so pages
// never have to reach into error.response.data.message manually.
export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message === 'Network Error') return 'Cannot reach the server. Please check your connection.';
  return err?.message || 'Something went wrong. Please try again.';
}

export default api;
