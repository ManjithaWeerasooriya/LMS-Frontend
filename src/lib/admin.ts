import { apiConfig } from '@/lib/config';

const { BASE_URL } = apiConfig;

export type AdminUserRole = 'Student' | 'Teacher' | 'Admin';
export type AdminUserStatus = 'Active' | 'Pending' | 'Suspended';

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminUserRole | string;
  status: AdminUserStatus | string;
  createdAt: string;
};

export type AdminUserListResponse = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  users: AdminUser[];
};

export type AdminUserQuery = {
  pageNumber?: number;
  pageSize?: number;
  role?: AdminUserRole;
  status?: AdminUserStatus;
};

export class AdminApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

const ADMIN_BASE = '/api/v1/admin';

function getAuthToken(): string {
  if (typeof window === 'undefined') {
    throw new AdminApiError('Authentication is required.', 401);
  }

  const token = window.localStorage.getItem('authToken');
  if (!token) {
    throw new AdminApiError('Authentication is required.', 401);
  }
  return token;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) {
      return data.message;
    }
  } catch {
    /* noop */
  }
  if (response.status === 404) {
    return 'User not found.';
  }
  return 'Something went wrong. Please try again.';
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new AdminApiError(message, response.status);
  }

  return response;
}

export async function getAdminUsers(query: AdminUserQuery): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  if (query.pageNumber) {
    params.set('pageNumber', String(query.pageNumber));
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }
  if (query.role) {
    params.set('role', query.role);
  }
  if (query.status) {
    params.set('status', query.status);
  }
  const search = params.toString();
  const response = await request(`${ADMIN_BASE}/users${search ? `?${search}` : ''}`, {
    method: 'GET',
  });
  return (await response.json()) as AdminUserListResponse;
}

export async function suspendUser(userId: string, reason = ''): Promise<void> {
  await request(`${ADMIN_BASE}/users/${userId}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({
      userId,
      reason,
    }),
  });
}

export async function reactivateUser(userId: string): Promise<void> {
  await request(`${ADMIN_BASE}/users/${userId}/reactivate`, {
    method: 'PATCH',
  });
}

export async function approveTeacher(userId: string): Promise<void> {
  await request(`${ADMIN_BASE}/users/${userId}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectTeacher(userId: string): Promise<void> {
  await request(`${ADMIN_BASE}/users/${userId}/reject`, {
    method: 'PATCH',
  });
}
