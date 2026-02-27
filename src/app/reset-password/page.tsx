import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto flex max-w-3xl items-center justify-center">
        <AuthCard title="Create a New Password" subtitle="Choose a strong password to secure your account.">
          <ResetPasswordForm token={searchParams?.token} />
        </AuthCard>
      </div>
    </main>
  );
}
