import axios, { AxiosHeaders, isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { apiConfig } from '@/lib/config';
import { clearStoredAuth, getStoredAuthToken, getStoredRefreshToken } from '@/lib/auth';
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

const apiClient = axios.create({
  baseURL: BASE_URL,
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
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

const storeAuthTokens = (payload: RefreshResponse) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('authToken', payload.accessToken);
  window.localStorage.setItem('refreshToken', payload.refreshToken);
  if (payload.tokenType) {
    window.localStorage.setItem('authTokenType', payload.tokenType);
  }
  if (payload.expiresIn && Number.isFinite(payload.expiresIn)) {
    window.localStorage.setItem('authTokenExpiresAt', (Date.now() + payload.expiresIn * 1000).toString());
  }
};

const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = getStoredRefreshToken();
  const deviceId = getDeviceId();

  if (!refreshToken || !deviceId) {
    throw new Error('Missing refresh credentials');
  }

  const response = await refreshClient.post<RefreshResponse>(endpoints.auth.refresh, {
    refreshToken,
    deviceId,
  });

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

  console.log('[apiClient] attaching Authorization header:', headers.get('Authorization') ?? 'none');

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RefreshableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

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
        return apiClient(originalRequest);
      } catch (refreshError) {
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
