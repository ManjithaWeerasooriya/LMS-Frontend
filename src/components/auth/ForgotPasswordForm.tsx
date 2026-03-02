'use client';

import { useState } from 'react';

import { FormInput } from '@/components/auth/FormInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';

type Status = 'idle' | 'loading' | 'success' | 'error';

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const mockRequest = (address: string) =>
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (address.endsWith('@invalid.com')) {
          reject(new Error('We could not find an account with that email.'));
        } else {
          resolve();
        }
      }, 1200);
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError('');
    setFeedback('');

    if (!validateEmail(email)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    try {
      setStatus('loading');
      await mockRequest(email);
      setStatus('success');
      setFeedback('If an account exists for this email, a reset link has been sent.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to send reset link.');
    } finally {
      setStatus((current) => (current === 'loading' ? 'idle' : current));
    }
  };

  const isLoading = status === 'loading';

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <FormInput
        id="forgot-email"
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        disabled={isLoading}
        error={fieldError}
        onChange={(event) => setEmail(event.target.value)}
        icon={<MailIcon />}
      />

      <PrimaryButton type="submit" loading={isLoading}>
        Send Reset Link
      </PrimaryButton>

      {feedback ? (
        <p className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
