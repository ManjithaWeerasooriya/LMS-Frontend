import { apiConfig } from '@/lib/config';
import { getStoredAuthToken } from '@/lib/auth';

export type UserProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
};

export class UserApiError extends Error {
  public status: number;
  public details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'UserApiError';
    this.status = status;
    this.details = details;
  }
}

const { BASE_URL } = apiConfig;

async function parseError(response: Response): Promise<{ message: string; details?: string[] }> {
  try {
    const data = (await response.json()) as { message?: string; errors?: unknown };
    const details: string[] = [];
    if (Array.isArray(data?.errors)) {
      data.errors.forEach((entry) => {
        if (typeof entry === 'string') {
          details.push(entry);
        } else if (entry && typeof entry === 'object') {
          const description = (entry as { description?: string }).description;
          const message = (entry as { message?: string }).message;
          if (description) details.push(description);
          if (message) details.push(message);
        }
      });
    } else if (data?.errors && typeof data.errors === 'object') {
      Object.values(data.errors as Record<string, unknown>).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string') details.push(item);
          });
        } else if (typeof value === 'string') {
          details.push(value);
        }
      });
    }
    return {
      message: data?.message || 'Something went wrong. Please try again.',
      details: details.length ? details : undefined,
    };
  } catch {
    return { message: 'Something went wrong. Please try again.' };
  }
}

async function authorizedRequest(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredAuthToken();
  if (!token) {
    throw new UserApiError('Authentication required.', 401);
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const { message, details } = await parseError(response);
    throw new UserApiError(message, response.status, details);
  }

  return response;
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await authorizedRequest('/api/v1/users/me', { method: 'GET' });
  return (await response.json()) as UserProfile;
}

export async function updateMyProfile(payload: { firstName?: string; lastName?: string; phone?: string }): Promise<UserProfile> {
  const response = await authorizedRequest('/api/v1/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return (await response.json()) as UserProfile;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(payload: { userId: string; token: string; newPassword: string; confirmPassword: string }): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const { message, details } = await parseError(response);
    throw new UserApiError(message, response.status, details);
  }
}
