import { Suspense } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginFormFallback() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
      <div className="border-t border-slate-200" />
      <div className="mx-auto h-5 w-40 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <AuthCard title="Genuine English" subtitle="Sign in to access your learning dashboard">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </AuthCard>
      </div>
    </main>
  );
}
