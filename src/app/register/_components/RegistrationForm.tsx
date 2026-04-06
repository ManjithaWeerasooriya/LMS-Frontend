'use client';

import Link from 'next/link';
import { useState } from 'react';

import { registerUser, RegisterError, type RegisterPayload, type RegistrationRole } from '@/lib/auth';
import { withRedirect } from '@/lib/navigation';

type FieldErrors = Partial<Record<'email' | 'password' | 'confirmPassword' | 'terms', string>>;

type FormStatus = {
  type: 'success' | 'error' | null;
  message: string;
};

type RegistrationFormProps = {
  role: RegistrationRole;
  title: string;
  subtitle: string;
  description?: string;
  successInstruction: string;
  submitLabel: string;
  redirectTo?: string;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export function RegistrationForm({
  role,
  title,
  subtitle,
  description,
  successInstruction,
  submitLabel,
  redirectTo,
}: RegistrationFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formStatus, setFormStatus] = useState<FormStatus>({ type: null, message: '' });
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClasses = (hasError?: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
      hasError ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-100'
    }`;

  const updateValue = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'acceptedTerms' ? (event.target as HTMLInputElement).checked : event.target.value;
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validate = () => {
    const errors: FieldErrors = {};

    if (!values.email.trim()) {
      errors.email = 'Email is required.';
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
      errors.terms = 'Please accept the terms to continue.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus({ type: null, message: '' });
    setErrorDetails([]);

    if (!validate()) {
      return;
    }

    const payload: RegisterPayload = {
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim() || undefined,
      lastName: values.lastName.trim() || undefined,
      role,
    };

    setIsSubmitting(true);
    try {
      const response = await registerUser(payload);
      const backendMessage = typeof response?.message === 'string' && response.message.trim().length > 0 ? response.message.trim() : 'Registration completed.';
      setFormStatus({ type: 'success', message: backendMessage });
      setFieldErrors({});
      setErrorDetails([]);
      setValues((previous) => ({
        ...previous,
        password: '',
        confirmPassword: '',
      }));
      // Keep first/last/email so the user can double-check what they submitted.
    } catch (error) {
      if (error instanceof RegisterError) {
        setFormStatus({ type: 'error', message: error.message });
        setErrorDetails(error.details ?? []);
      } else {
        setFormStatus({ type: 'error', message: 'Unable to register at the moment. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-[32px] bg-white p-10 shadow-2xl">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">{subtitle}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-3 text-base text-slate-500">{description}</p> : null}
      </header>

      {formStatus.type === 'success' ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-semibold">{formStatus.message}</p>
          <p className="mt-2 text-sm">{successInstruction}</p>
          <p className="mt-2 text-sm">
            Use the link below to return to the login page whenever you&apos;re ready.
          </p>
          <Link
            href={withRedirect('/login', redirectTo)}
            className="mt-4 inline-flex rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            Continue to login
          </Link>
        </div>
      ) : null}

      {formStatus.type === 'error' ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">{formStatus.message}</p>
          {errorDetails.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={values.firstName}
              onChange={updateValue('firstName')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={values.lastName}
              onChange={updateValue('lastName')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email <span aria-hidden className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue('email')}
            disabled={isSubmitting}
            className={inputClasses(Boolean(fieldErrors.email))}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            required
          />
          {fieldErrors.email ? (
            <p id="email-error" className="text-sm text-red-600">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password <span aria-hidden className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={values.password}
            onChange={updateValue('password')}
            disabled={isSubmitting}
            className={inputClasses(Boolean(fieldErrors.password))}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            required
          />
          <p className="text-xs text-slate-500">Must be at least 8 characters long.</p>
          {fieldErrors.password ? (
            <p id="password-error" className="text-sm text-red-600">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Confirm Password <span aria-hidden className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={updateValue('confirmPassword')}
            disabled={isSubmitting}
            className={inputClasses(Boolean(fieldErrors.confirmPassword))}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
            required
          />
          {fieldErrors.confirmPassword ? (
            <p id="confirmPassword-error" className="text-sm text-red-600">
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              id="terms"
              type="checkbox"
              checked={values.acceptedTerms}
              onChange={updateValue('acceptedTerms')}
              disabled={isSubmitting}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              I agree to the{' '}
              <Link href="#" className="font-semibold text-blue-800 hover:text-blue-600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="font-semibold text-blue-800 hover:text-blue-600">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.terms ? <p className="text-sm text-red-600">{fieldErrors.terms}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#2F4EA2] py-3 text-base font-semibold text-white transition hover:bg-[#243b7a] disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          href={withRedirect('/login', redirectTo)}
          className="font-semibold text-blue-800 hover:text-blue-600"
        >
          Back to Login
        </Link>
      </p>
    </section>
  );
}
