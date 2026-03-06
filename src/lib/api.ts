import axios from 'axios';

const DEFAULT_LOCAL_API_URL = 'http://localhost:5251';

const resolveApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // If env variable is provided, use it
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // During development fallback to localhost
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[api] NEXT_PUBLIC_API_URL not set. Using local API.');
    return DEFAULT_LOCAL_API_URL;
  }

  // In production build environments (CI), do not crash the build
  console.warn(
    '[api] NEXT_PUBLIC_API_URL missing during build. API calls may fail until it is configured.'
  );

  return '';
};

const API_URL = resolveApiUrl();

export const API_BASE_URL = API_URL;

if (process.env.NODE_ENV === 'production' && API_URL) {
  console.info(`[api] Resolved API base URL: ${API_URL}`);
}

export const api = axios.create({
  baseURL: API_URL || undefined,
});

export default api;