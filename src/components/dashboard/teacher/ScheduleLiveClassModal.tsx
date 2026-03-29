'use client';

import { useState } from 'react';

import { scheduleLiveClass, type ScheduleLiveClassInput } from '@/lib/teacher';

export type ScheduleLiveClassModalProps = {
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
};

export function ScheduleLiveClassModal({
  open,
  onClose,
  onScheduled,
}: ScheduleLiveClassModalProps) {
  const [form, setForm] = useState<ScheduleLiveClassInput>({
    topic: '',
    date: '',
    time: '',
    meetingLink: '',
    enableRecording: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleChange = <K extends keyof ScheduleLiveClassInput>(
    key: K,
    value: ScheduleLiveClassInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.topic.trim() || !form.date || !form.time) return;

    setIsSubmitting(true);
    try {
      await scheduleLiveClass(form);
      onClose();
      if (onScheduled) {
        onScheduled();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Schedule Live Class</h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the date, time, and meeting details for your live session.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="live-topic">
              Class Topic
            </label>
            <input
              id="live-topic"
              type="text"
              required
              value={form.topic}
              onChange={(event) => handleChange('topic', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter topic"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="live-date">
                Date
              </label>
              <input
                id="live-date"
                type="date"
                required
                value={form.date}
                onChange={(event) => handleChange('date', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="live-time">
                Time
              </label>
              <input
                id="live-time"
                type="time"
                required
                value={form.time}
                onChange={(event) => handleChange('time', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="live-meeting-link">
              Meeting Link
            </label>
            <input
              id="live-meeting-link"
              type="url"
              value={form.meetingLink ?? ''}
              onChange={(event) => handleChange('meetingLink', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="https://meet.google.com/xxx-xxx-xxx"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.enableRecording ?? false}
              onChange={(event) => handleChange('enableRecording', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Enable Recording</span>
          </label>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.topic.trim() || !form.date || !form.time}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Scheduling…' : 'Schedule Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
