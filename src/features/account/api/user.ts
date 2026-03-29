import { apiConfig } from '@/lib/config';
import { apiClient, isAxiosAuthError } from '@/lib/http';
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateMyProfileRequest,
  UserProfileRequest,
} from '@/generated/api-types';

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
    const data = await response.json();
    return extractErrors(data);
  } catch {
    return { message: 'Something went wrong. Please try again.' };
  }
}

function extractErrors(payload: unknown): { message: string; details?: string[] } {
  const details: string[] = [];
  if (payload && typeof payload === 'object' && 'errors' in payload) {
    const err = (payload as { errors?: unknown }).errors;
    if (Array.isArray(err)) {
      err.forEach((entry) => {
        if (typeof entry === 'string') {
          details.push(entry);
        } else if (entry && typeof entry === 'object') {
          const description = (entry as { description?: string }).description;
          const message = (entry as { message?: string }).message;
          if (description) details.push(description);
          if (message) details.push(message);
        }
      });
    } else if (err && typeof err === 'object') {
      Object.values(err as Record<string, unknown>).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string') details.push(item);
          });
        } else if (typeof value === 'string') {
          details.push(value);
        }
      });
    }
  } else if (Array.isArray(payload)) {
    payload.forEach((entry) => {
      if (typeof entry === 'string') {
        details.push(entry);
      }
    });
  }

  const message =
    (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: string }).message === 'string'
      ? (payload as { message?: string }).message
      : undefined) || 'Something went wrong. Please try again.';

  return {
    message,
    details: details.length ? details : undefined,
  };
}

export async function getMyProfile(): Promise<UserProfile> {
  try {
    const { data } = await apiClient.get<UserProfileRequest>('/api/v1/users/me');
    return {
      id: data.id ?? '',
      email: data.email ?? '',
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phone: data.phone ?? null,
      status: data.status != null ? String(data.status) : undefined,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt ?? null,
    };
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function updateMyProfile(payload: UpdateMyProfileRequest): Promise<UserProfile> {
  try {
    const { data } = await apiClient.put<UserProfileRequest>('/api/v1/users/me', payload);
    return {
      id: data.id ?? '',
      email: data.email ?? '',
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phone: data.phone ?? null,
      status: data.status != null ? String(data.status) : undefined,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt ?? null,
    };
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function requestAccountDeletion(): Promise<{ message?: string }> {
  try {
    const { data } = await apiClient.post<{ message?: string }>('/api/v1/users/me/delete-request');
    return data;
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function confirmAccountDeletion(params: { userId: string; token: string }): Promise<{ message?: string }> {
  try {
    const { data } = await apiClient.get<{ message?: string }>('/api/v1/users/confirm-delete', { params });
    return data;
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const payload: ForgotPasswordRequest = { email };
  await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
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

function convertAxiosError(error: unknown): never {
  if (isAxiosAuthError(error) && error.response) {
    const { message, details } = extractErrors(error.response.data);
    throw new UserApiError(message, error.response.status, details);
  }
  if (error instanceof Error) {
    throw new UserApiError(error.message, 0);
  }
  throw new UserApiError('Unable to complete request.', 0);
}
