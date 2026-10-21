import axios from 'axios';

// withCredentials sends the HTTP-only session cookie with every request.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', withCredentials: true });

export const errorMessage = (err) => err.response?.data?.error || 'Could not reach the server. Check your connection and try again.';
export const fieldErrors = (err) =>
  Object.fromEntries((err.response?.data?.details || []).map((d) => [d.field, d.message]));

export default api;
