'use client';

import { useEffect, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { getTeacherCourses, type TeacherCourse } from '@/features/teacher/api/teacher';
import {
  LIVE_SESSION_MEETING_TYPE,
  createTeacherLiveSession,
  getLiveSessionErrorMessage,
  type TeacherLiveSessionInput,
} from '@/features/teacher/live-sessions/api';

export type ScheduleLiveSessionModalProps = {
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
};

type ScheduleLiveSessionFormState = TeacherLiveSessionInput & {
  courseId: string;
};

const initialFormState: ScheduleLiveSessionFormState = {
  courseId: '',
  title: '',
  description: '',
  startTimeLocal: '',
  durationMinutes: 60,
  recordingEnabled: false,
  playbackEnabled: false,
  meetingType: LIVE_SESSION_MEETING_TYPE.room,
  roomId: '',
  groupId: '',
  meetingLink: '',
  meetingId: '',
  passcode: '',
};

export function ScheduleLiveSessionModal({
  open,
  onClose,
  onScheduled,
}: ScheduleLiveSessionModalProps) {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [form, setForm] = useState<ScheduleLiveSessionFormState>(initialFormState);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialFormState);
      setError(null);
      return;
    }

    let active = true;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setError(null);

      try {
        const allCourses = await getTeacherCourses();
        if (!active) return;

        setCourses(allCourses);
        setForm((current) => ({
          ...current,
          courseId: current.courseId || allCourses[0]?.id || '',
        }));
      } catch (loadError) {
        if (!active) return;
        setError(
          getLiveSessionErrorMessage(
            loadError,
            'Unable to load courses for live-session scheduling.',
          ),
        );
      } finally {
        if (active) {
          setIsLoadingCourses(false);
        }
      }
    };

    void loadCourses();

    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const handleChange = <K extends keyof ScheduleLiveSessionFormState>(
    key: K,
    value: ScheduleLiveSessionFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasMeetingLocator =
      (form.meetingType === LIVE_SESSION_MEETING_TYPE.room && form.roomId.trim()) ||
      (form.meetingType === LIVE_SESSION_MEETING_TYPE.group && form.groupId.trim()) ||
      (form.meetingType === LIVE_SESSION_MEETING_TYPE.teams &&
        (form.meetingLink.trim() ||
          (form.meetingId.trim() && form.passcode.trim())));

    if (
      !form.courseId ||
      !form.title.trim() ||
      !form.startTimeLocal ||
      form.durationMinutes <= 0 ||
      !hasMeetingLocator
    ) {
      setError('Complete the required meeting type and locator fields before scheduling.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTeacherLiveSession(form.courseId, {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        startTimeLocal: form.startTimeLocal,
        durationMinutes: form.durationMinutes,
        recordingEnabled: form.recordingEnabled,
        playbackEnabled: form.playbackEnabled,
        ...(form.meetingType === LIVE_SESSION_MEETING_TYPE.room
          ? {
              meetingType: LIVE_SESSION_MEETING_TYPE.room as const,
              roomId: form.roomId.trim(),
            }
          : form.meetingType === LIVE_SESSION_MEETING_TYPE.group
            ? {
                meetingType: LIVE_SESSION_MEETING_TYPE.group as const,
                groupId: form.groupId.trim(),
              }
            : form.meetingLink.trim()
              ? {
                  meetingType: LIVE_SESSION_MEETING_TYPE.teams as const,
                  meetingLink: form.meetingLink.trim(),
                }
              : {
                  meetingType: LIVE_SESSION_MEETING_TYPE.teams as const,
                  meetingId: form.meetingId.trim(),
                  passcode: form.passcode.trim(),
                }),
      });

      onClose();
      onScheduled?.();
    } catch (submitError) {
      setError(getLiveSessionErrorMessage(submitError, 'Unable to schedule the live session.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const canSubmit =
    !isLoadingCourses &&
    courses.length > 0 &&
    Boolean(form.courseId) &&
    Boolean(form.title.trim()) &&
    Boolean(form.startTimeLocal) &&
    form.durationMinutes > 0 &&
    Boolean(
      (form.meetingType === LIVE_SESSION_MEETING_TYPE.room && form.roomId.trim()) ||
        (form.meetingType === LIVE_SESSION_MEETING_TYPE.group && form.groupId.trim()) ||
        (form.meetingType === LIVE_SESSION_MEETING_TYPE.teams &&
          (form.meetingLink.trim() || (form.meetingId.trim() && form.passcode.trim()))),
    );

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
            <h2 className="text-xl font-semibold text-slate-900">Schedule Live Session</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a course, set a start time, and configure recording for the session.
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

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <ErrorAlert message={error ?? ''} />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="live-session-course">
              Course
            </label>
            <select
              id="live-session-course"
              value={form.courseId}
              onChange={(event) => handleChange('courseId', event.target.value)}
              disabled={isLoadingCourses || isSubmitting || courses.length === 0}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              {courses.length === 0 ? (
                <option value="">
                  {isLoadingCourses ? 'Loading courses…' : 'Create a course first'}
                </option>
              ) : null}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="live-session-title">
              Title
            </label>
            <input
              id="live-session-title"
              type="text"
              required
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Weekly speaking workshop"
            />
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
              value={form.description ?? ''}
              onChange={(event) => handleChange('description', event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Outline what will be covered and any preparation students should do."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="live-session-start-time"
              >
                Start Time
              </label>
              <input
                id="live-session-start-time"
                type="datetime-local"
                required
                value={form.startTimeLocal}
                onChange={(event) => handleChange('startTimeLocal', event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
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
                value={form.durationMinutes}
                onChange={(event) =>
                  handleChange('durationMinutes', Number(event.target.value) || 0)
                }
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="live-session-meeting-type"
              >
                Meeting type
              </label>
              <select
                id="live-session-meeting-type"
                value={form.meetingType}
                onChange={(event) =>
                  handleChange('meetingType', Number(event.target.value) as ScheduleLiveSessionFormState['meetingType'])
                }
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value={LIVE_SESSION_MEETING_TYPE.room}>Room</option>
                <option value={LIVE_SESSION_MEETING_TYPE.group}>Group</option>
                <option value={LIVE_SESSION_MEETING_TYPE.teams}>Teams</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={form.recordingEnabled}
                onChange={(event) => handleChange('recordingEnabled', event.target.checked)}
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
                checked={form.playbackEnabled}
                onChange={(event) => handleChange('playbackEnabled', event.target.checked)}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Playback enabled
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Make the recording available to students after processing completes.
                </span>
              </span>
            </label>
          </div>

          {form.meetingType === LIVE_SESSION_MEETING_TYPE.room ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="schedule-live-session-room-id">
                Room ID
              </label>
              <input
                id="schedule-live-session-room-id"
                type="text"
                value={form.roomId}
                onChange={(event) => handleChange('roomId', event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="ACS room ID"
              />
            </div>
          ) : null}

          {form.meetingType === LIVE_SESSION_MEETING_TYPE.group ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="schedule-live-session-group-id">
                Group ID
              </label>
              <input
                id="schedule-live-session-group-id"
                type="text"
                value={form.groupId}
                onChange={(event) => handleChange('groupId', event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="ACS group ID"
              />
            </div>
          ) : null}

          {form.meetingType === LIVE_SESSION_MEETING_TYPE.teams ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="schedule-live-session-meeting-link">
                  Teams meeting link
                </label>
                <input
                  id="schedule-live-session-meeting-link"
                  type="text"
                  value={form.meetingLink ?? ''}
                  onChange={(event) => handleChange('meetingLink', event.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                />
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Or use meeting ID and passcode
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="schedule-live-session-meeting-id">
                    Meeting ID
                  </label>
                  <input
                    id="schedule-live-session-meeting-id"
                    type="text"
                    value={form.meetingId ?? ''}
                    onChange={(event) => handleChange('meetingId', event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Teams meeting ID"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="schedule-live-session-passcode">
                    Passcode
                  </label>
                  <input
                    id="schedule-live-session-passcode"
                    type="text"
                    value={form.passcode ?? ''}
                    onChange={(event) => handleChange('passcode', event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Teams passcode"
                  />
                </div>
              </div>
            </div>
          ) : null}

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
              disabled={isSubmitting || !canSubmit}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
