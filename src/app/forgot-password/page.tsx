import Link from 'next/link';

import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-12">
      <div className="mx-auto flex max-w-3xl items-center justify-center">
        <AuthCard
          title="Reset Your Password"
          subtitle="Enter the email associated with your account and we’ll send you instructions to reset it."
        >
          <ForgotPasswordForm />
          <div className="mt-8 border-t border-slate-200" />
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-900 hover:text-blue-700"
            >
              <span aria-hidden>←</span>
              Back to Login
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Genuine English LMS</p>
        </AuthCard>
      </div>
    </main>
  );
}
