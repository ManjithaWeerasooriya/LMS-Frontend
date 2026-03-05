import axios from "axios";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:5251"
).replace(/\/+$/, "");

export const API_BASE_URL = API_URL;

export const api = axios.create({
  baseURL: API_URL,
});

export default api;