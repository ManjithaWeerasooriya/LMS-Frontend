'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { FormInput } from '@/components/auth/FormInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';

type Status = 'idle' | 'loading' | 'success' | 'error';
type TokenState = 'valid' | 'missing' | 'expired';

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

function evaluateStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', color: 'text-red-600', bar: 'bg-red-400 w-1/3' };
  }
  if (score === 2 || score === 3) {
    return { label: 'Moderate', color: 'text-amber-600', bar: 'bg-amber-400 w-2/3' };
  }
  return { label: 'Strong', color: 'text-emerald-600', bar: 'bg-emerald-500 w-full' };
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [tokenState, setTokenState] = useState<TokenState>(() => {
    if (!token) return 'missing';
    if (token === 'expired') return 'expired';
    return 'valid';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setTokenState(() => {
      if (!token) return 'missing';
      if (token === 'expired') return 'expired';
      return 'valid';
    });
  }, [token]);

  const strength = useMemo(() => evaluateStrength(password), [password]);

  const mockReset = () =>
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (token === 'error') {
          reject(new Error('Reset link is invalid or has already been used.'));
        } else {
          resolve();
        }
      }, 1200);
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFeedback('');

    if (tokenState !== 'valid') {
      return;
    }

    const errors: { password?: string; confirmPassword?: string } = {};

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords must match.';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    try {
      setStatus('loading');
      await mockReset();
      setStatus('success');
      setFeedback('Password updated successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1800);
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setStatus((current) => (current === 'loading' ? 'idle' : current));
    }
  };

  if (tokenState !== 'valid') {
    const message = tokenState === 'missing' ? 'This reset link is invalid.' : 'This reset link has expired.';
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">{message}</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-900 hover:border-blue-400 hover:bg-blue-50"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <FormInput
        id="new-password"
        label="New Password"
        type="password"
        placeholder="Enter a new password"
        value={password}
        disabled={status === 'loading'}
        error={fieldErrors.password}
        onChange={(event) => setPassword(event.target.value)}
        icon={<LockIcon />}
      />

      <div>
        <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
          <span>Password Strength</span>
          <span className={strength.color}>{strength.label}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${strength.bar}`} />
        </div>
      </div>

      <FormInput
        id="confirm-password"
        label="Confirm Password"
        type="password"
        placeholder="Re-enter new password"
        value={confirmPassword}
        disabled={status === 'loading'}
        error={fieldErrors.confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        icon={<LockIcon />}
      />

      <PrimaryButton type="submit" loading={status === 'loading'}>
        Update Password
      </PrimaryButton>

      {feedback ? (
        <p className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
