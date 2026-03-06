import axios from 'axios';

const DEFAULT_LOCAL_API_URL = 'http://localhost:5251';

const resolveApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL in production. Set it in your deployment environment and redeploy.'
    );
  }

  return DEFAULT_LOCAL_API_URL;
};

const API_URL = resolveApiUrl();

export const API_BASE_URL = API_URL;

if (process.env.NODE_ENV === 'production') {
  console.info(`[api] Resolved API base URL: ${API_URL}`);
}

export const api = axios.create({
  baseURL: API_URL,
});

export default api;
