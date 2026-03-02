import { apiConfig } from '@/lib/config';
import { getDeviceId } from '@/lib/device';

export type UserRole = 'Student' | 'Instructor' | 'Admin';

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
  if (!role) {
    return undefined;
  }

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

export async function loginUser({ email, password }: LoginParams): Promise<LoginResult> {
  const { BASE_URL, endpoints } = apiConfig;
  const rawDeviceId = getDeviceId();
  const normalizedDeviceId = typeof rawDeviceId === 'string' ? rawDeviceId.trim() : '';
  const deviceId = normalizedDeviceId.length > 0 ? normalizedDeviceId : `fallback-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  const requestBody = { email, password, deviceId };
  console.log('[loginUser] request body:', requestBody);

  try {
    const response = await fetch(`${BASE_URL}${endpoints.auth.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      throw new LoginError('Invalid credentials', 401);
    }

    if (response.status === 403) {
      throw new LoginError('Account pending approval or suspended', 403);
    }

    if (response.status >= 500) {
      throw new LoginError('Unable to sign in. Please try again later.', response.status);
    }

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new LoginError(errorPayload?.message || 'Unable to sign in. Please try again later.', response.status);
    }

    const data = (await response.json()) as ApiLoginResponse;
    if (!data?.accessToken || !data.refreshToken) {
      throw new LoginError('Unexpected response from server.');
    }

    const tokenType = data.tokenType?.trim() || DEFAULT_TOKEN_TYPE;
    const expiresIn = typeof data.expiresIn === 'number' && Number.isFinite(data.expiresIn) ? data.expiresIn : 0;
    const normalizedRole = normalizeRole(data.user?.role);

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authTokenType', tokenType);
      if (expiresIn > 0) {
        localStorage.setItem('authTokenExpiresAt', (Date.now() + expiresIn * 1000).toString());
      } else {
        localStorage.removeItem('authTokenExpiresAt');
      }
      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      } else {
        localStorage.removeItem('userRole');
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
    if (error instanceof LoginError) {
      throw error;
    }

    throw new LoginError('Something went wrong. Please check your connection and try again.');
  }
}
