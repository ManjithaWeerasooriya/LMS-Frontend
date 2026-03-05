import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5251';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
