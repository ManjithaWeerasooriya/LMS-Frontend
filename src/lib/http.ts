import axios, { AxiosHeaders, isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { apiConfig } from '@/lib/config';
import {
  AUTH_STATE_CHANGE_EVENT,
  clearStoredAuth,
  decodeJwt,
  decodeJwtHeader,
  getStoredAuthToken,
  getStoredRefreshToken,
} from '@/lib/auth';
import { getDeviceId } from '@/lib/device';

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
};

interface RefreshableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const { BASE_URL, endpoints } = apiConfig;

const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const resolvedBaseUrl = (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : BASE_URL)?.replace(/\/+$/, '') ?? BASE_URL;

const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
});

const refreshClient = axios.create({
  baseURL: resolvedBaseUrl,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
const pendingRequests: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  pendingRequests.forEach((pending) => {
    if (error) {
      pending.reject(error);
      return;
    }
    if (token) {
      pending.resolve(token);
    }
  });
  pendingRequests.length = 0;
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.replace('/login');
  }
};

const formatJwtPreview = (token?: string | null) => (token ? `${token.slice(0, 25)}...` : null);

const logTokenDetails = (label: string, token: string) => {
  const header = decodeJwtHeader(token);
  const payload = decodeJwt(token);
  console.log(`[${label}] accessToken (raw):`, token);
  console.log(`[${label}] header:`, header);
  console.log(`[${label}] payload:`, payload);
  console.log(`[${label}] summary:`, {
    alg: header?.alg ?? null,
    kid: header?.kid ?? null,
    sub: payload?.sub ?? null,
    role: payload?.role ?? null,
    iss: payload?.iss ?? null,
    aud: payload?.aud ?? null,
    exp: payload?.exp ?? null,
    length: token.length,
  });
};

const storeAuthTokens = (payload: RefreshResponse) => {
  if (typeof window === 'undefined') return;

  if (payload.accessToken) {
    logTokenDetails('refreshAuthToken', payload.accessToken);
  }

  console.log('[refreshAuthToken] Replacing tokens in storage:', {
    accessTokenPreview: formatJwtPreview(payload.accessToken),
    refreshTokenPreview: formatJwtPreview(payload.refreshToken),
  });

  window.localStorage.setItem('authToken', payload.accessToken);
  window.localStorage.setItem('refreshToken', payload.refreshToken);

  if (payload.tokenType) {
    window.localStorage.setItem('authTokenType', payload.tokenType);
  }

  if (payload.expiresIn && Number.isFinite(payload.expiresIn)) {
    window.localStorage.setItem(
      'authTokenExpiresAt',
      (Date.now() + payload.expiresIn * 1000).toString(),
    );
  }

  if (payload.accessToken) {
    const bearer = `Bearer ${payload.accessToken}`;
    apiClient.defaults.headers.common.Authorization = bearer;
    refreshClient.defaults.headers.common.Authorization = bearer;
    console.log('[refreshAuthToken] Updated axios default Authorization header.');
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
};

const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = getStoredRefreshToken();
  const deviceId = getDeviceId();

  console.log('[refreshAuthToken] DeviceId resolved for refresh:', deviceId);
  console.log('[refreshAuthToken] Request payload:', {
    deviceId,
    refreshTokenPreview: refreshToken ? `${refreshToken.slice(0, 8)}...` : null,
  });

  if (!refreshToken || !deviceId) {
    throw new Error('Missing refresh credentials');
  }

  const response = await refreshClient.post<RefreshResponse>(endpoints.auth.refresh, {
    refreshToken,
    deviceId,
  });

  console.log('[refreshAuthToken] Response data:', response.data);

  storeAuthTokens(response.data);
  return response.data.accessToken;
};

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  const headers = AxiosHeaders.from(config.headers ?? {});

  console.log('[apiClient] token from storage:', token ? `${token.slice(0, 12)}...` : null);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  const rawAuthorization = headers.get('Authorization');
  const normalizedAuthorization =
    typeof rawAuthorization === 'string'
      ? rawAuthorization
      : rawAuthorization == null
        ? null
        : String(rawAuthorization);
  const authPreview = normalizedAuthorization ? `${normalizedAuthorization.slice(0, 35)}...` : 'none';
  const requestUrl =
    config.baseURL && config.url && !config.url.startsWith('http')
      ? `${config.baseURL}${config.url}`
      : config.url ?? '(unknown URL)';

  console.log('[apiClient] attaching Authorization header:', authPreview, '→', requestUrl);

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RefreshableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    console.log('[apiClient] 401 detected, attempting refresh...', originalRequest.url);

    if (originalRequest._retry || originalRequest.url?.includes(endpoints.auth.refresh)) {
      clearStoredAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAuthToken();

      try {
        const newToken = await refreshPromise;
        processQueue(null, newToken);

        const headers = AxiosHeaders.from(originalRequest.headers ?? {});
        headers.set('Authorization', `Bearer ${newToken}`);
        originalRequest.headers = headers;
        console.log('[apiClient] Refresh success, retrying request...');

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.warn('[apiClient] Refresh failed, logging out...', refreshError);
        processQueue(refreshError, null);
        clearStoredAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return new Promise((resolve, reject) => {
      pendingRequests.push({
        resolve: (token: string) => {
          const headers = AxiosHeaders.from(originalRequest.headers ?? {});
          headers.set('Authorization', `Bearer ${token}`);
          originalRequest.headers = headers;
          resolve(apiClient(originalRequest));
        },
        reject,
      });
    });
  },
);

export const isAxiosAuthError = (error: unknown): error is AxiosError => isAxiosError(error);

export const clearApiAuthorizationHeader = () => {
  delete apiClient.defaults.headers.common.Authorization;
};

export { apiClient };
