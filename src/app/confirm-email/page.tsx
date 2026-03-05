'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { apiConfig } from '@/lib/config';

type Status = 'loading' | 'success' | 'error';

const { BASE_URL, endpoints } = apiConfig;

const extractErrors = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractErrors(entry));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('description' in obj && typeof obj.description === 'string') {
      return [obj.description.trim()];
    }
    return Object.values(obj).flatMap((entry) => extractErrors(entry));
  }

  return [];
};

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const paramsKey = useMemo(() => searchParams.toString(), [searchParams]);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const confirmEmail = async () => {
      const params = new URLSearchParams(paramsKey);
      const userId = params.get('userId');
      const token = params.get('token');

      if (!userId || !token) {
        if (isCancelled) {
          return;
        }
        setStatus('error');
        setMessage('Missing confirmation details. Please open the full link from your email.');
        setDetails([]);
        return;
      }

      if (isCancelled) {
        return;
      }

      setStatus('loading');
      setMessage('Verifying your email...');
      setDetails([]);

      try {
        const url = `${BASE_URL}${endpoints.auth.confirmEmail}?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
        const response = await fetch(url);
        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          const errorMessage =
            payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: string }).message === 'string'
              ? (payload as { message: string }).message
              : 'Email verification failed.';
          setStatus('error');
          setMessage(errorMessage);
          setDetails(payload && typeof payload === 'object' && 'errors' in payload ? extractErrors((payload as { errors?: unknown }).errors) : []);
          return;
        }

        const successMessage =
          payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: string }).message === 'string'
            ? (payload as { message: string }).message
            : 'Email verified successfully.';
        setStatus('success');
        setMessage(successMessage);
        setDetails([]);
      } catch {
        if (isCancelled) {
          return;
        }
        setStatus('error');
        setMessage('Unable to verify email. Please try again.');
      }
    };

    void confirmEmail();

    return () => {
      isCancelled = true;
    };
  }, [paramsKey]);

  const statusClasses =
    status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-3xl justify-center">
        <section className="w-full rounded-[32px] bg-white p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Email Confirmation</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Confirming your email</h1>

          <div className={`mt-8 rounded-2xl border px-6 py-5 ${statusClasses}`}>
            <p className="text-base font-semibold">{message}</p>
            {status === 'loading' ? <p className="mt-2 text-sm">This will only take a moment...</p> : null}
          </div>

          {details.length ? (
            <ul className="mt-4 list-disc space-y-1 text-left text-sm text-red-700 sm:mx-auto sm:max-w-lg">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="rounded-2xl border border-blue-200 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50"
            >
              Go to Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConfirmEmailFallback() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-3xl justify-center">
        <section className="w-full rounded-[32px] bg-white p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Email Confirmation</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Loading confirmation…</h1>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-slate-700">
            <p className="text-base font-semibold">Preparing your confirmation status...</p>
          </div>
        </section>
      </div>
    </div>
  );
}
