'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { LoginError, loginUser, type UserRole } from '@/lib/auth';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

type IconInputProps = {
  name: string;
  type: 'email' | 'password';
  placeholder: string;
  value: string;
  disabled?: boolean;
  error?: string;
  icon: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function IconInput({ name, type, placeholder, value, disabled, error, icon, onChange }: IconInputProps) {
  const inputId = `${name}-input`;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
          error ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <span className="text-slate-500" aria-hidden>
          {icon}
        </span>
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          required
          disabled={disabled}
          onChange={onChange}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <polyline points="3,7 12,13 21,7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

export default function Home() {
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
      const roleRedirects: Record<UserRole, string> = {
        Student: '/dashboard/student',
        Instructor: '/dashboard/teacher',
        Admin: '/dashboard/admin',
      };
      router.push(role ? roleRedirects[role] ?? '/dashboard' : '/dashboard');
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
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <section className="w-full max-w-3xl rounded-[32px] bg-white p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="text-slate-900">
              <p className="text-2xl font-semibold tracking-tight">Genuine English</p>
              <p className="text-lg font-semibold text-blue-700">with Isuru Samarakoon</p>
              <p className="mt-1 text-base font-medium text-slate-500">Learning Management System</p>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {formError ? <ErrorAlert message={formError} /> : null}

            <IconInput
              name="email"
              type="email"
              placeholder="Email address"
              value={email}
              disabled={isLoading}
              error={fieldErrors.email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<MailIcon />}
            />

            <IconInput
              name="password"
              type="password"
              placeholder="Password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-[#2F4EA2] py-3 text-base font-semibold text-white transition hover:bg-[#26408a] disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="my-8 border-t border-slate-200" />

          <div className="space-y-4 text-center">
            <p className="text-sm font-medium text-slate-500">Don’t have an account?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/register/student"
                className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
              >
                Register as Student
              </Link>
              <Link
                href="/register/instructor"
                className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
              >
                Register as Instructor
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
