import { apiConfig } from '@/lib/config';
import { getDeviceId } from '@/lib/device';
import { api } from '@/lib/api';
import { isAxiosError } from 'axios';

export type UserRole = 'Student' | 'Instructor' | 'Admin';
export type RegistrationRole = 'Student' | 'Teacher';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: RegistrationRole;
}

export type RegisterResponse = {
  message?: string;
  userId?: string;
  status?: string;
  role?: string;
};

export type DecodedJwt = {
  exp?: number;
  role?: string;
  sub?: string;
  name?: string;
  nameid?: string;
  nameidentifier?: string;
  userId?: string;
  email?: string;
  [key: string]: unknown;
};

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  role?: UserRole;
}

type ApiLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user?: {
    role?: string | null;
  };
};

const DEFAULT_TOKEN_TYPE = 'Bearer';

function normalizeRole(role?: string | null): UserRole | undefined {
  if (!role) return undefined;

  const normalized = role.trim().toLowerCase();
  if (normalized === 'student') return 'Student';
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'teacher' || normalized === 'instructor') return 'Instructor';
  return undefined;
}

export class LoginError extends Error {
  public status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LoginError';
    this.status = status;
  }
}

export class RegisterError extends Error {
  public status?: number;
  public details?: string[];
  constructor(message: string, status?: number, details?: string[]) {
    super(message);
    this.name = 'RegisterError';
    this.status = status;
    this.details = details;
  }
}

export async function loginUser({ email, password }: LoginParams): Promise<LoginResult> {
  const { endpoints } = apiConfig;

  const rawDeviceId = getDeviceId();
  const normalizedDeviceId = typeof rawDeviceId === 'string' ? rawDeviceId.trim() : '';
  const deviceId =
    normalizedDeviceId.length > 0
      ? normalizedDeviceId
      : `fallback-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

  const requestBody = { email, password, deviceId };

  try {
    const { data } = await api.post<ApiLoginResponse>(endpoints.auth.login, requestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!data?.accessToken || !data.refreshToken)
      throw new LoginError('Unexpected response from server.');

    const tokenType = data.tokenType?.trim() || DEFAULT_TOKEN_TYPE;
    const expiresIn =
      typeof data.expiresIn === 'number' && Number.isFinite(data.expiresIn)
        ? data.expiresIn
        : 0;

    const normalizedRole = normalizeRole(data.user?.role);

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authTokenType', tokenType);

      if (expiresIn > 0) {
        localStorage.setItem(
          'authTokenExpiresAt',
          (Date.now() + expiresIn * 1000).toString()
        );
      }

      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      }
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn,
      tokenType,
      role: normalizedRole,
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const errorPayload =
        error.response?.data && typeof error.response.data === 'object'
          ? (error.response.data as { message?: string })
          : null;

      if (status === 401) throw new LoginError('Invalid credentials', 401);
      if (status === 403) throw new LoginError('Account pending approval or suspended', 403);
      if (typeof status === 'number' && status >= 500)
        throw new LoginError('Unable to sign in. Please try again later.', status);
      if (typeof status === 'number') {
        throw new LoginError(
          errorPayload?.message || 'Unable to sign in. Please try again later.',
          status
        );
      }
    }

    if (error instanceof LoginError) throw error;
    throw new LoginError('Something went wrong. Please check your connection and try again.');
  }
}

const AUTH_STORAGE_KEYS = ['authToken', 'refreshToken', 'authTokenType', 'authTokenExpiresAt', 'userRole'] as const;

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('authToken');
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('refreshToken');
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4 || 4)) % 4;
  const padded = normalized.padEnd(normalized.length + padding, '=');

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(padded);
  }

  if (typeof atob === 'function') {
    return atob(padded);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('binary');
  }

  throw new Error('No base64 decoder available');
}

export function decodeJwt(token: string | null | undefined): DecodedJwt | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = decodeBase64Url(payload);
    return JSON.parse(decoded) as DecodedJwt;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  if (typeof window === 'undefined') return;

  const refreshToken = getStoredRefreshToken();
  const token = getStoredAuthToken();
  const deviceId = getDeviceId();

  try {
    if (refreshToken && deviceId) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await fetch(`${apiConfig.BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken, deviceId }),
      });
    }
  } catch (error) {
    console.warn('[logoutUser] Failed to log out cleanly.', error);
  } finally {
    clearStoredAuth();
  }
}

type ErrorPayload = {
  message?: string;
  errors?: unknown;
};

function parseErrorPayload(payload: unknown): { message?: string; details: string[] } {
  const detailsSet = new Set<string>();

  const recordDetail = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) detailsSet.add(trimmed);
  };

  const fromArray = (value: unknown) => {
    if (!Array.isArray(value)) return;
    value.forEach((item) => {
      if (typeof item === 'string') {
        recordDetail(item);
      } else if (item && typeof item === 'object') {
        const description = (item as { description?: string }).description;
        const message = (item as { message?: string }).message;
        if (typeof description === 'string') recordDetail(description);
        if (typeof message === 'string') recordDetail(message);
      }
    });
  };

  if (Array.isArray(payload)) {
    fromArray(payload);
  } else if (payload && typeof payload === 'object') {
    const value = payload as ErrorPayload;
    if (Array.isArray(value.errors)) {
      fromArray(value.errors);
    } else if (value.errors && typeof value.errors === 'object') {
      Object.values(value.errors as Record<string, unknown>).forEach((entry) => {
        if (Array.isArray(entry)) {
          fromArray(entry);
        } else if (typeof entry === 'string') {
          recordDetail(entry);
        }
      });
    }
  }

  let message: string | undefined;
  if (typeof payload === 'string') {
    message = payload;
  } else if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message?: string }).message === 'string'
  ) {
    message = (payload as { message: string }).message;
  }

  const details = Array.from(detailsSet);
  if (!message && details.length > 0) {
    [message] = details;
  }

  return { message, details };
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const { BASE_URL, endpoints } = apiConfig;

  const response = await fetch(`${BASE_URL}${endpoints.auth.register}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let data: unknown = null;
  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const { message, details } = parseErrorPayload(data);
    throw new RegisterError(message || 'Unable to register. Please try again.', response.status, details);
  }

  if (data && typeof data === 'object') {
    return data as RegisterResponse;
  }

  return { message: 'Registered successfully.' };
}
