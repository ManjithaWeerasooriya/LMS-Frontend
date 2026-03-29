import Link from 'next/link';

import { AuthCard } from '@/components/auth/AuthCard';

const registrationOptions = [
  {
    href: '/register/student',
    title: 'Student Registration',
    description: 'Join courses, submit assignments, and track your progress in one place.',
    cta: 'Register as Student',
  },
];

export default function RegisterLandingPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl justify-center">
        <AuthCard
          title="Student Registration"
          subtitle="Create a student account to access lessons, assignments, and progress tracking."
        >
          <div className="grid gap-4">
            {registrationOptions.map((option) => (
              <section
                key={option.href}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <h2 className="text-xl font-semibold text-slate-900">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">{option.description}</p>
                <Link
                  href={option.href}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  {option.cta}
                </Link>
              </section>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-blue-800 hover:text-blue-600"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </AuthCard>
      </div>
    </main>
  );
}
