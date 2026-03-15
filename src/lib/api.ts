import axios from 'axios';

const DEFAULT_LOCAL_API_URL = 'http://localhost:5251';

const resolveApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    console.info('[api] Resolving API base from NEXT_PUBLIC_API_URL:', envUrl);
    return envUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[api] NEXT_PUBLIC_API_URL not set. Using local API.');
    return DEFAULT_LOCAL_API_URL;
  }

  console.warn(
    '[api] NEXT_PUBLIC_API_URL missing during build. API calls may fail until it is configured.'
  );

  return '';
};

const API_URL = resolveApiUrl();

if (API_URL) {
  console.info('[api] Resolved API base URL (active):', API_URL);
} else {
  console.warn('[api] API base URL resolved to an empty string. Network calls may fail.');
}

export const API_BASE_URL = API_URL;

export const api = axios.create({
  baseURL: API_URL || undefined,
});

export default api;
