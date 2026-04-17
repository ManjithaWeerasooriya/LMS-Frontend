'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { logoutUser } from '@/lib/auth';
import {
  requestPasswordReset,
  updateMyProfile,
  uploadProfileImage,
  UserApiError,
} from '@/features/account/api/user';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const getDisplayName = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim();
  return fullName || email?.trim() || 'My Account';
};

const getInitials = (label: string) => {
  const parts = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'MA';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export function AccountSettings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { profile, setProfile, isLoading, error: profileError } = useCurrentUserProfile();

  const [draftValues, setDraftValues] = useState({ firstName: '', lastName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const updatePreviewUrl = (nextPreviewUrl: string | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(nextPreviewUrl);
  };

  const clearSelectedPhoto = () => {
    setSelectedFile(null);
    updatePreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (field: 'firstName' | 'lastName') => (event: ChangeEvent<HTMLInputElement>) => {
    setDraftValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) {
      setPhotoMessage({ type: 'error', message: 'Please choose a JPG or PNG image.' });
      setSelectedFile(null);
      updatePreviewUrl(null);
      event.target.value = '';
      return;
    }

    if (file.size >= MAX_PROFILE_IMAGE_BYTES) {
      setPhotoMessage({ type: 'error', message: 'Profile image must be smaller than 5 MB.' });
      setSelectedFile(null);
      updatePreviewUrl(null);
      event.target.value = '';
      return;
    }

    setPhotoMessage(null);
    setSelectedFile(file);
    updatePreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !isEditing) return;

    setIsSaving(true);
    setSaveMessage(null);
    setSaveErrors([]);

    try {
      const updated = await updateMyProfile({
        firstName: draftValues.firstName.trim(),
        lastName: draftValues.lastName.trim(),
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

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      setPhotoMessage({ type: 'error', message: 'Choose an image before uploading.' });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage(null);

    try {
      const updatedProfile = await uploadProfileImage(selectedFile);
      setProfile(updatedProfile);
      setPhotoMessage({ type: 'success', message: 'Profile photo updated successfully.' });
      clearSelectedPhoto();
    } catch (error) {
      if (error instanceof UserApiError && (error.status === 401 || error.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      if (error instanceof UserApiError) {
        setPhotoMessage({ type: 'error', message: error.message });
      } else {
        setPhotoMessage({ type: 'error', message: 'Unable to upload profile photo.' });
      }
    } finally {
      setIsUploadingPhoto(false);
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

  const displayName = getDisplayName(profile?.firstName, profile?.lastName, profile?.email);
  const avatarInitials = getInitials(displayName);
  const displayedPhotoUrl = previewUrl || profile?.profileImageUrl || null;

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
      ) : profileError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {profileError}
        </div>
      ) : profile ? (
        <section className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {displayedPhotoUrl ? (
                  <img
                    src={displayedPhotoUrl}
                    alt={displayName}
                    className="h-24 w-24 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1B3B8B] text-2xl font-bold text-white shadow-sm">
                    {avatarInitials}
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Profile Photo</h2>
                  <p className="text-sm text-slate-500">
                    Upload a JPG or PNG image smaller than 5 MB.
                  </p>
                  {selectedFile ? (
                    <p className="mt-2 text-sm font-semibold text-blue-700">{selectedFile.name}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handlePhotoSelection}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={!selectedFile || isUploadingPhoto}
                  className="rounded-2xl bg-[#2F4EA2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#243b7a] disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </div>

            {photoMessage ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  photoMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {photoMessage.message}
              </div>
            ) : null}
          </section>

          <form
            onSubmit={handleSaveProfile}
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
                <p className="text-sm text-slate-500">Update your personal information.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) {
                    setDraftValues({
                      firstName: profile.firstName ?? '',
                      lastName: profile.lastName ?? '',
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
                  value={isEditing ? draftValues.firstName : profile.firstName ?? ''}
                  onChange={handleFieldChange('firstName')}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-700">
                Last Name
                <input
                  type="text"
                  value={isEditing ? draftValues.lastName : profile.lastName ?? ''}
                  onChange={handleFieldChange('lastName')}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
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
                <p className="text-sm text-slate-500">
                  Send yourself a reset link to update your password securely.
                </p>
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
      ) : (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          Unable to load profile.
        </div>
      )}
    </div>
  );
}
