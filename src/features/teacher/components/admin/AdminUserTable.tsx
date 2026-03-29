'use client';

import { type AdminUser } from '@/features/teacher/api/admin';

type ActionType = 'suspend' | 'reactivate' | 'approve' | 'reject';

type AdminUserTableProps = {
  users: AdminUser[];
  isLoading: boolean;
  currentUserId?: string;
  actionState: { userId: string; type: ActionType } | null;
  onSuspend: (userId: string) => void;
  onReactivate: (userId: string) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
};

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  suspended: 'bg-rose-50 text-rose-700',
};

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

export function AdminUserTable({
  users,
  isLoading,
  currentUserId,
  actionState,
  onSuspend,
  onReactivate,
  onApprove,
  onReject,
}: AdminUserTableProps) {
  const renderActions = (user: AdminUser) => {
    const role = normalize(user.role);
    const status = normalize(user.status);

    const canManage = role !== 'admin' && user.id !== currentUserId;
    if (!canManage) {
      return <span className="text-sm text-slate-400">—</span>;
    }

    const buttons: React.ReactNode[] = [];

    const suspendDisabled = actionState?.userId === user.id && actionState?.type === 'suspend';
    const reactivateDisabled = actionState?.userId === user.id && actionState?.type === 'reactivate';
    const approveDisabled = actionState?.userId === user.id && actionState?.type === 'approve';
    const rejectDisabled = actionState?.userId === user.id && actionState?.type === 'reject';

    if (status !== 'suspended') {
      buttons.push(
        <button
          key="suspend"
          type="button"
          onClick={() => onSuspend(user.id)}
          disabled={suspendDisabled}
          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {suspendDisabled ? 'Suspending...' : 'Suspend'}
        </button>,
      );
    } else {
      buttons.push(
        <button
          key="reactivate"
          type="button"
          onClick={() => onReactivate(user.id)}
          disabled={reactivateDisabled}
          className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {reactivateDisabled ? 'Reactivating...' : 'Reactivate'}
        </button>,
      );
    }

    if (role === 'teacher' && status === 'pending') {
      buttons.push(
        <button
          key="approve"
          type="button"
          onClick={() => onApprove(user.id)}
          disabled={approveDisabled}
          className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {approveDisabled ? 'Approving...' : 'Approve'}
        </button>,
      );
      buttons.push(
        <button
          key="reject"
          type="button"
          onClick={() => onReject(user.id)}
          disabled={rejectDisabled}
          className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {rejectDisabled ? 'Rejecting...' : 'Reject'}
        </button>,
      );
    }

    if (!buttons.length) {
      return <span className="text-sm text-slate-400">—</span>;
    }

    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">First Name</th>
              <th className="px-6 py-3">Last Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>
                  No users found for the selected filters.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const status = normalize(user.status);
                const badgeClass = statusStyles[status] ?? 'bg-slate-100 text-slate-600';
                const statusLabel = user.status ?? 'Unknown';
                const roleLabel = user.role ?? '—';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4 text-slate-700">{user.firstName || '—'}</td>
                    <td className="px-6 py-4 text-slate-700">{user.lastName || '—'}</td>
                    <td className="px-6 py-4 text-slate-700">{roleLabel}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{statusLabel}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">{renderActions(user)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
