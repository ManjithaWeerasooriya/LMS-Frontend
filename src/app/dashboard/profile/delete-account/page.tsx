'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import TeacherDashboardLayout from '@/app/teacher/dashboard/layout';
import { useConfirm } from '@/context/ConfirmContext';
import { logoutUser } from '@/lib/auth';
import { requestAccountDeletion, UserApiError } from '@/lib/user';

function DeleteAccountContent() {
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<string[]>([]);
  const confirm = useConfirm();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed || isSubmitting) return;

    const approved = await confirm({
      title: 'Delete your account?',
      description: 'This action cannot be undone. All sessions will be terminated.',
      variant: 'danger',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
    });

    if (!approved) {
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');
    setDetails([]);

    try {
      const response = await requestAccountDeletion();
      setStatus('success');
      setMessage(response.message ?? 'A confirmation email has been sent. Please check your inbox.');
    } catch (error) {
      if (error instanceof UserApiError) {
        if (error.status === 401) {
          await logoutUser();
          router.replace('/login');
          return;
        }
        setStatus('error');
        setMessage(error.message);
        setDetails(error.details ?? []);
      } else {
        setStatus('error');
        setMessage('Unable to submit deletion request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertClass =
    status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Delete Account</h1>
        <p className="mt-1 text-sm text-slate-500">Request permanent deletion of your LMS account.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <p className="font-semibold">This action is irreversible.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>All sessions will be terminated immediately after confirmation.</li>
            <li>Your data, courses, and activity history will be permanently deleted.</li>
            <li>You will need to create a new account to regain access.</li>
          </ul>
        </div>

        {status !== 'idle' ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${alertClass}`}>
            <p className="font-semibold">{message}</p>
            {details.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(event) => setIsConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
          />
          <span>I understand that this action is permanent and cannot be undone.</span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Back to Profile
          </Link>
          <button
            type="submit"
            disabled={!isConfirmed || isSubmitting}
            className="rounded-2xl border border-rose-400 bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-200"
          >
            {isSubmitting ? 'Sending Request...' : 'Request Account Deletion'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <TeacherDashboardLayout>
      <DeleteAccountContent />
    </TeacherDashboardLayout>
  );
}
