import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  timeout: 10000,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mandal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mandal_token');
      localStorage.removeItem('mandal_auth');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
