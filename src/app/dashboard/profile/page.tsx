'use client';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import TeacherDashboardLayout from '@/app/teacher/dashboard/layout';
import { decodeJwt, getStoredAuthToken, logoutUser } from '@/lib/auth';
import { getMyProfile, requestPasswordReset, updateMyProfile, UserApiError, type UserProfile } from '@/lib/user';

export function ProfileContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formValues, setFormValues] = useState({ firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState<string>('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const roleLabel = useMemo(() => {
    const token = getStoredAuthToken();
    const payload = decodeJwt(token);
    if (!payload) {
      return 'Unknown';
    }
    const role = payload.role || (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | undefined);
    return role ?? 'Unknown';
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        if (!active) return;
        setProfile(data);
        setFormValues({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
        });
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        if (error instanceof UserApiError && (error.status === 401 || error.status === 403)) {
          await logoutUser();
          router.replace('/login');
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Unable to load profile.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const handleFieldChange = (field: 'firstName' | 'lastName') => (event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !isEditing) return;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveErrors([]);
    try {
      const updated = await updateMyProfile({
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
      });
      setProfile(updated);
      setSaveMessage({ type: 'success', message: 'Profile updated successfully.' });
      setIsEditing(false);
    } catch (error) {
      if (error instanceof UserApiError && (error.status === 401 || error.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }
      if (error instanceof UserApiError) {
        setSaveMessage({ type: 'error', message: error.message });
        setSaveErrors(error.details ?? []);
      } else {
        setSaveMessage({ type: 'error', message: 'Unable to update profile.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!profile?.email) {
      setResetMessage('Email unavailable for password reset.');
      return;
    }
    setIsSendingReset(true);
    setResetMessage('');
    try {
      await requestPasswordReset(profile.email);
      setResetMessage('If an account exists, a password reset link has been sent.');
    } catch {
      setResetMessage('Unable to send reset link. Please try again later.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account details and security.</p>
      </header>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      ) : loadError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{loadError}</div>
      ) : (
        <section className="space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
                <p className="text-sm text-slate-500">Update your personal information.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    setFormValues({
                      firstName: profile?.firstName ?? '',
                      lastName: profile?.lastName ?? '',
                    });
                  }
                  setIsEditing((prev) => !prev);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {saveMessage ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  saveMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {saveMessage.message}
                {saveErrors.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                    {saveErrors.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-700">
                First Name
                <input
                  type="text"
                  value={formValues.firstName}
                  onChange={handleFieldChange('firstName')}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-700">
                Last Name
                <input
                  type="text"
                  value={formValues.lastName}
                  onChange={handleFieldChange('lastName')}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-slate-500"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-700">
                Role
                <input type="text" value={roleLabel} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-slate-500" />
              </label>
            </div>

            {isEditing ? (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#2F4EA2] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#243b7a] disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : null}
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-500">Send yourself a reset link to update your password securely.</p>
              </div>
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={isSendingReset}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:w-auto"
              >
                {isSendingReset ? 'Sending...' : 'Send Reset Link'}
              </button>
              {resetMessage ? <p className="text-sm text-slate-600">{resetMessage}</p> : null}
            </div>
          </section>

        </section>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <TeacherDashboardLayout>
      <ProfileContent />
    </TeacherDashboardLayout>
  );
}
