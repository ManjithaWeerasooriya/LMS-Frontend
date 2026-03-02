import { apiClient, isAxiosAuthError } from '@/lib/http';

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
  try {
    const { data } = await apiClient.get<AdminUserListResponse>(`${ADMIN_BASE}/users${search ? `?${search}` : ''}`);
    return data;
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function suspendUser(userId: string, reason = ''): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/suspend`, { userId, reason });
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function reactivateUser(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/reactivate`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function approveTeacher(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/approve`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function rejectTeacher(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/reject`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

function convertAxiosError(error: unknown): never {
  if (isAxiosAuthError(error) && error.response) {
    const message = (error.response.data as { message?: string } | undefined)?.message ?? 'Unable to complete request.';
    throw new AdminApiError(message, error.response.status);
  }
  if (error instanceof Error) {
    throw new AdminApiError(error.message, 0);
  }
  throw new AdminApiError('Unable to complete request.', 0);
}
