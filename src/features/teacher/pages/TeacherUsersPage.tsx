'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminUserTable } from '@/features/teacher/components/admin/AdminUserTable';
import { useConfirm } from '@/context/ConfirmContext';
import {
  AdminApiError,
  approveTeacher,
  getAdminUsers,
  reactivateUser,
  rejectTeacher,
  suspendUser,
  type AdminUserListResponse,
  type AdminUserRole,
  type AdminUserStatus,
} from '@/features/teacher/api/admin';
import { decodeJwt, getStoredAuthToken, logoutUser } from '@/lib/auth';

const PAGE_SIZE = 20;
const roleOptions: Array<'All' | AdminUserRole> = ['All', 'Student', 'Teacher', 'Admin'];
const statusOptions: Array<'All' | AdminUserStatus> = ['All', 'Active', 'Pending', 'Suspended'];

type ToastState = { type: 'success' | 'error'; message: string } | null;
type ActionType = 'suspend' | 'reactivate' | 'approve' | 'reject';

export default function AdminUserManagementPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [roleFilter, setRoleFilter] = useState<'All' | AdminUserRole>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | AdminUserStatus>('All');
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [actionState, setActionState] = useState<{ userId: string; type: ActionType } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const token = getStoredAuthToken();
    const payload = decodeJwt(token);
    if (payload) {
      const userId =
        (typeof payload.sub === 'string' && payload.sub) ||
        (typeof payload.nameid === 'string' && payload.nameid) ||
        (typeof payload.nameidentifier === 'string' && payload.nameidentifier) ||
        (typeof payload.userId === 'string' && payload.userId) ||
        undefined;
      setCurrentUserId(userId);
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const handle = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const handleAuthFailure = useCallback(
    (error: AdminApiError) => {
      if (error.status === 401 || error.status === 403) {
        void logoutUser();
        router.replace('/login');
        return true;
      }
      return false;
    },
    [router],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAdminUsers({
        pageNumber,
        pageSize: PAGE_SIZE,
        role: roleFilter === 'All' ? undefined : roleFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
      });
      setData(response);
      if (response.pageNumber !== pageNumber) {
        setPageNumber(response.pageNumber);
      }
    } catch (error) {
      if (error instanceof AdminApiError) {
        if (handleAuthFailure(error)) {
          return;
        }
        setToast({ type: 'error', message: error.message });
      } else {
        setToast({ type: 'error', message: 'Unable to load users. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, roleFilter, statusFilter, handleAuthFailure]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const totalCount = data?.totalCount ?? 0;
  const effectivePageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / effectivePageSize) || 1);
  const startIndex = totalCount === 0 ? 0 : (pageNumber - 1) * effectivePageSize + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(totalCount, pageNumber * effectivePageSize);

  const runAction = useCallback(
    async (userId: string, type: ActionType, action: () => Promise<void>, successMessage: string) => {
      setActionState({ userId, type });
      try {
        await action();
        setToast({ type: 'success', message: successMessage });
        await fetchUsers();
      } catch (error) {
        if (error instanceof AdminApiError) {
          if (handleAuthFailure(error)) {
            return;
          }
          setToast({ type: 'error', message: error.message });
        } else {
          setToast({ type: 'error', message: 'Request failed. Please try again.' });
        }
      } finally {
        setActionState(null);
      }
    },
    [fetchUsers, handleAuthFailure],
  );

  const onSuspend = useCallback(
    (userId: string) => {
      void (async () => {
        const approved = await confirm({
          title: 'Suspend this user?',
          description: 'Suspended users cannot sign in until you reactivate them.',
          variant: 'warning',
          confirmText: 'Suspend User',
          cancelText: 'Keep Active',
        });
        if (!approved) return;
        await runAction(userId, 'suspend', () => suspendUser(userId, ''), 'User suspended.');
      })();
    },
    [confirm, runAction],
  );

  const onReactivate = useCallback(
    (userId: string) => {
      void runAction(userId, 'reactivate', () => reactivateUser(userId), 'User reactivated.');
    },
    [runAction],
  );

  const onApprove = useCallback(
    (userId: string) => {
      void (async () => {
        const approved = await confirm({
          title: 'Approve this teacher?',
          description: 'They will gain immediate access to instructor tools.',
          variant: 'default',
          confirmText: 'Approve',
          cancelText: 'Not Now',
        });
        if (!approved) return;
        await runAction(userId, 'approve', () => approveTeacher(userId), 'Teacher approved.');
      })();
    },
    [confirm, runAction],
  );

  const onReject = useCallback(
    (userId: string) => {
      void (async () => {
        const approved = await confirm({
          title: 'Reject this application?',
          description: 'The applicant will be notified and must reapply to be considered again.',
          variant: 'danger',
          confirmText: 'Reject',
          cancelText: 'Cancel',
        });
        if (!approved) return;
        await runAction(userId, 'reject', () => rejectTeacher(userId), 'Teacher rejected.');
      })();
    },
    [confirm, runAction],
  );

  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Teacher Management</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">Review user accounts and manage access policies.</p>
      </header>

      {toast ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="text-xs font-semibold uppercase tracking-wide">
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Filters</p>
            <p className="text-base font-semibold text-slate-900">Refine by role or status</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as typeof roleFilter);
                  setPageNumber(1);
                }}
                className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as typeof statusFilter);
                  setPageNumber(1);
                }}
                className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <AdminUserTable
        users={data?.users ?? []}
        isLoading={isLoading}
        currentUserId={currentUserId}
        actionState={actionState}
        onSuspend={onSuspend}
        onReactivate={onReactivate}
        onApprove={onApprove}
        onReject={onReject}
      />

      <footer className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">
            Showing {startIndex}-{endIndex} of {totalCount} users
          </p>
          <p className="text-xs text-slate-500">
            Page {Math.min(pageNumber, totalPages)} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={!canGoPrev || isLoading}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPageNumber((prev) => prev + 1)}
            disabled={!canGoNext || isLoading}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
