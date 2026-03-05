'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { resetPassword, UserApiError } from '@/lib/user';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const userId = useMemo(() => searchParams.get('userId') ?? searchParams.get('userid'), [searchParams]);
  const token = useMemo(() => searchParams.get('token'), [searchParams]);

  useEffect(() => {
    setFormError(null);
    setDetails([]);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !token) {
      setFormError('Reset link is invalid or expired.');
      return;
    }
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setDetails([]);

    try {
      await resetPassword({
        userId,
        token,
        newPassword,
        confirmPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 2500);
    } catch (error) {
      if (error instanceof UserApiError) {
        setFormError(error.message);
        setDetails(error.details ?? []);
      } else {
        setFormError('Unable to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = !userId || !token;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Account Security</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a new password to secure your account.</p>

        {!userId || !token ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Reset link is invalid or expired.
          </div>
        ) : null}

        {isSuccess ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Password updated successfully. Redirecting to login…
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={disabled || isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={disabled || isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {formError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
                {details.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                    {details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={disabled || isSubmitting}
              className="w-full rounded-2xl bg-[#2F4EA2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243b7a] disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-500">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
