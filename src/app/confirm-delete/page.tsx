'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useConfirm } from '@/context/ConfirmContext';
import { clearStoredAuth } from '@/lib/auth';
import { confirmAccountDeletion, UserApiError } from '@/lib/user';

type Status = 'loading' | 'success' | 'error';

export default function ConfirmDeletePage() {
  return (
    <Suspense fallback={<ConfirmDeleteFallback />}>
      <ConfirmDeleteContent />
    </Suspense>
  );
}

function ConfirmDeleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramsKey = useMemo(() => searchParams.toString(), [searchParams]);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Finalizing your account deletion...');
  const [details, setDetails] = useState<string[]>([]);
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;

    const confirmDeletion = async () => {
      const params = new URLSearchParams(paramsKey);
      const userId = params.get('userId');
      const token = params.get('token');

      if (!userId || !token) {
        setStatus('error');
        setMessage('Missing deletion parameters. Please open the full link from your email.');
        setDetails([]);
        return;
      }

      try {
        setStatus('loading');
        setMessage('Finalizing your account deletion...');
        setDetails([]);

        const approved = await confirm({
          title: 'Finalize account deletion?',
          description: 'Confirming will permanently remove your LMS account and sign you out everywhere.',
          variant: 'danger',
          confirmText: 'Delete Account',
          cancelText: 'Keep Account',
        });

        if (!approved) {
          if (!cancelled) {
            setStatus('error');
            setMessage('Account deletion was canceled. Close this page to keep your account.');
            setDetails([]);
          }
          return;
        }

        const response = await confirmAccountDeletion({ userId, token });
        if (cancelled) return;
        clearStoredAuth();
        setStatus('success');
        setMessage(response.message ?? 'Your account has been deleted successfully.');
        setTimeout(() => {
          if (!cancelled) {
            router.replace('/');
          }
        }, 3000);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof UserApiError) {
          setStatus('error');
          setMessage(error.message);
          setDetails(error.details ?? []);
        } else {
          setStatus('error');
          setMessage('Unable to confirm account deletion. Please request a new link.');
        }
      }
    };

    void confirmDeletion();

    return () => {
      cancelled = true;
    };
  }, [confirm, paramsKey, router]);

  const statusClasses =
    status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-3xl justify-center">
        <section className="w-full rounded-[32px] bg-white p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Account Deletion</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Confirming deletion</h1>

          <div className={`mt-8 rounded-2xl border px-6 py-5 ${statusClasses}`}>
            <p className="text-base font-semibold">{message}</p>
            {status === 'loading' ? <p className="mt-2 text-sm">This will only take a moment...</p> : null}
          </div>

          {details.length ? (
            <ul className="mt-4 list-disc space-y-1 text-left text-sm text-rose-700 sm:mx-auto sm:max-w-lg">
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

function ConfirmDeleteFallback() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-3xl justify-center">
        <section className="w-full rounded-[32px] bg-white p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Account Deletion</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Loading status…</h1>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-slate-700">
            <p className="text-base font-semibold">Preparing your deletion request...</p>
          </div>
        </section>
      </div>
    </div>
  );
}
