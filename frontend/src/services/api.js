import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
});

// Interceptor: inyectar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('araquiu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejar 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // No redirigir si el 401 viene del login (para que muestre el mensaje de error)
    if (err.response?.status === 401 && !err.config.url.includes('/api/auth/login')) {
      localStorage.removeItem('araquiu_token');
      localStorage.removeItem('araquiu_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
