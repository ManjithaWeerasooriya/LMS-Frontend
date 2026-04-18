'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  defaultLiveSessionEditorValues,
  liveSessionEditorSchema,
  type LiveSessionEditorValues,
} from '@/features/teacher/live-sessions/schemas';

type LiveSessionFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: LiveSessionEditorValues;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: LiveSessionEditorValues) => Promise<void> | void;
};

export function LiveSessionFormModal({
  open,
  mode,
  initialValues,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: LiveSessionFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LiveSessionEditorValues>({
    resolver: zodResolver(liveSessionEditorSchema),
    defaultValues: initialValues ?? defaultLiveSessionEditorValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(initialValues ?? defaultLiveSessionEditorValues);
  }, [initialValues, open, reset]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === 'create' ? 'Create Live Session' : 'Edit Live Session'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create'
                ? 'Add a course live session with recording and playback settings.'
                : 'Update the session schedule and delivery settings for this course.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit((values) => onSubmit(values))} className="mt-5 space-y-5">
          <ErrorAlert message={error ?? ''} />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="live-session-title">
              Title
            </label>
            <input
              id="live-session-title"
              type="text"
              {...register('title')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Weekly speaking workshop"
            />
            {errors.title ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold text-slate-700"
              htmlFor="live-session-description"
            >
              Description
            </label>
            <textarea
              id="live-session-description"
              rows={4}
              {...register('description')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Outline what will be covered and any prep students should do."
            />
            {errors.description ? (
              <p className="text-xs text-rose-600">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="live-session-start-time"
              >
                Start date and time
              </label>
              <input
                id="live-session-start-time"
                type="datetime-local"
                {...register('startTimeLocal')}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {errors.startTimeLocal ? (
                <p className="text-xs text-rose-600">{errors.startTimeLocal.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="live-session-duration"
              >
                Duration (minutes)
              </label>
              <input
                id="live-session-duration"
                type="number"
                min={1}
                max={1440}
                {...register('durationMinutes', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {errors.durationMinutes ? (
                <p className="text-xs text-rose-600">{errors.durationMinutes.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 p-4">
              <input
                type="checkbox"
                {...register('recordingEnabled')}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Recording enabled
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Allow the session to be recorded when the backend recording flow starts.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 p-4">
              <input
                type="checkbox"
                {...register('playbackEnabled')}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Playback enabled
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Surface the recording to students once the backend marks it available.
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Create Session'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
