'use client';

import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <AuthCard
          title="Genuine English"
          subtitle="Sign in to access your learning dashboard"
        >
          <LoginForm />
        </AuthCard>
      </div>
    </main>
  );
}