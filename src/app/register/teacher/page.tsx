'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { registerUser, RegisterError, type RegisterPayload } from '@/lib/auth';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

type FormStatus = {
  type: 'success' | 'error' | null;
  message: string;
  details?: string[];
};

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export default function TeacherRegistrationPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'acceptedTerms' ? (event.target as HTMLInputElement).checked : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const errors: FieldErrors = {};

    if (!values.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
      errors.password = 'Password is required.';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords must match.';
    }

    if (!values.acceptedTerms) {
      errors.acceptedTerms = 'Please accept the terms to continue.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus({ type: null, message: '' });
    setFieldErrors({});

    if (!validate()) {
      return;
    }

    const payload: RegisterPayload = {
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim() || undefined,
      lastName: values.lastName.trim() || undefined,
      role: 'Teacher',
    };

    setIsSubmitting(true);
    try {
      const response = await registerUser(payload);
      const backendMessage = response?.message?.trim() || 'Registration request submitted.';
      setStatus({
        type: 'success',
        message: `${backendMessage} Verify your email before logging in.`,
      });
      setValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        acceptedTerms: false,
      }));
    } catch (error) {
      if (error instanceof RegisterError) {
        setStatus({ type: 'error', message: error.message, details: error.details });
      } else {
        setStatus({
          type: 'error',
          message: 'Unable to complete registration right now. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (hasError?: boolean, pill = true) =>
    `w-full ${pill ? 'rounded-[999px]' : 'rounded-2xl'} border px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
      hasError ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100' : 'border-[#dfe7f5] bg-[#f7f9fc] focus:border-blue-500 focus:ring-blue-100'
    }`;

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (!values.email.trim() || !values.password || !values.confirmPassword) return true;
    if (!values.acceptedTerms) return true;
    return false;
  }, [isSubmitting, values]);

  return (
    <main className="min-h-screen bg-[#f2f5fb] px-4 py-10">
      <div className="mx-auto max-w-[620px] rounded-[32px] bg-white p-12 shadow-2xl">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#2f4ea2]">Share your expertise with Genuine English</p>
          <h1 className="mt-4 text-[36px] font-semibold text-slate-900">Teacher Registration</h1>
          <p className="mt-3 text-base text-slate-500">Submit your details to request instructor access. Admin approval is required before you can teach.</p>
        </header>

        {status.type === 'success' ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">{status.message}</p>
          </div>
        ) : null}

        {status.type === 'error' ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-semibold">{status.message}</p>
            {status.details?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {status.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              First Name
              <input type="text" value={values.firstName} onChange={updateValue('firstName')} disabled={isSubmitting} className={`${inputClasses()} mt-1 h-12`} />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Last Name
              <input type="text" value={values.lastName} onChange={updateValue('lastName')} disabled={isSubmitting} className={`${inputClasses()} mt-1 h-12`} />
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={values.email}
              onChange={updateValue('email')}
              disabled={isSubmitting}
              className={`${inputClasses(fieldErrors.email)} h-12`}
            />
            {fieldErrors.email ? <p className="text-xs text-rose-600">{fieldErrors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={values.password}
              onChange={updateValue('password')}
              disabled={isSubmitting}
              className={`${inputClasses(fieldErrors.password)} h-12`}
            />
            <p className="text-xs text-slate-500">Must be at least 8 characters long.</p>
            {fieldErrors.password ? <p className="text-xs text-rose-600">{fieldErrors.password}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={values.confirmPassword}
              onChange={updateValue('confirmPassword')}
              disabled={isSubmitting}
              className={`${inputClasses(fieldErrors.confirmPassword)} h-12`}
            />
            {fieldErrors.confirmPassword ? <p className="text-xs text-rose-600">{fieldErrors.confirmPassword}</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={values.acceptedTerms}
                onChange={updateValue('acceptedTerms')}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{' '}
                <a href="/terms" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {fieldErrors.acceptedTerms ? <p className="mt-2 text-xs text-rose-600">{fieldErrors.acceptedTerms}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="h-[52px] w-full rounded-[999px] bg-gradient-to-r from-[#2446c0] to-[#2f4ea2] text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Register as Teacher'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </main>
  );
}

