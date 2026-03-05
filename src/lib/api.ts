import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "").replace(/\/+$/, "");

if (!API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Add it in Vercel Environment Variables and redeploy."
  );
}

export const API_BASE_URL = API_URL;

export const api = axios.create({
  baseURL: API_URL,
});

export default api;