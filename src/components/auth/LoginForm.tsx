'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { FormInput } from '@/components/auth/FormInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { LoginError, loginUser, type UserRole } from '@/lib/auth';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateFields = () => {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const { role } = await loginUser({ email, password });
      const redirectMap: Record<UserRole, string> = {
        Student: '/dashboard/student',
        Instructor: '/dashboard/teacher',
        Admin: '/dashboard/admin',
      };
      router.push(role ? redirectMap[role] ?? '/dashboard' : '/dashboard');
    } catch (error) {
      if (error instanceof LoginError) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {formError ? <ErrorAlert message={formError} /> : null}

      <FormInput
        id="login-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        disabled={isLoading}
        error={fieldErrors.email}
        onChange={(event) => setEmail(event.target.value)}
        icon={<MailIcon />}
      />

      <FormInput
        id="login-password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        disabled={isLoading}
        error={fieldErrors.password}
        onChange={(event) => setPassword(event.target.value)}
        icon={<LockIcon />}
      />

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember me</span>
        </label>
        <Link href="/forgot-password" className="font-semibold text-blue-800 hover:text-blue-600">
          Forgot password?
        </Link>
      </div>

      <PrimaryButton type="submit" loading={isLoading}>
        Sign In
      </PrimaryButton>

      <div className="border-t border-slate-200" />

      <div className="text-center">
        <p className="text-sm text-slate-500">Don’t have an account?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/register/student"
            className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Register as Student
          </Link>
          <Link
            href="/register/teacher"
            className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Register as Teacher
          </Link>
        </div>
      </div>
    </form>
  );
}
