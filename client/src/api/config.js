// client/src/api/config.js
import axios from 'axios';

// Prefer explicit VITE_API_URL (e.g. http://localhost:5000/api or https://monsieurmadame.ca/api)
// Fallback: same-origin + '/api' so the site works behind a reverse proxy in prod.
const resolveBaseURL = () => {
  const env = import.meta?.env?.VITE_API_URL;
  if (env && typeof env === 'string') {
    return env.replace(/\/+$/, ''); // strip trailing slash
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: false, // flip to true if you move to httpOnly cookies later
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Normalize errors and optionally handle 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Request failed';

    // Attach a stable message for UI
    err.normalizedMessage = message;

    // Optional: redirect on unauthorized (kept minimal and safe)
    if (status === 401 || status === 403) {
      try {
        // If you store tokens in localStorage, clear on hard auth failures
        // localStorage.removeItem('token');
      } catch (_) {}
      // Avoid redirect loops on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // window.location.href = '/login';
        // For now we just reject; uncomment the redirect when desired.
      }
    }
    return Promise.reject(err);
  }
);

export default api; 