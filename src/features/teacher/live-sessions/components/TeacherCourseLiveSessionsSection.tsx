'use client';

import { useEffect, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { useConfirm } from '@/context/ConfirmContext';
import {
  LIVE_SESSION_MEETING_TYPE,
  LIVE_SESSION_STATUS,
  cancelTeacherLiveSession,
  createTeacherLiveSession,
  getLiveSessionErrorMessage,
  getTeacherLiveSessionsByCourse,
  updateTeacherLiveSession,
  type TeacherLiveSession,
} from '@/features/teacher/live-sessions/api';
import { LiveSessionCalendar } from '@/features/teacher/live-sessions/components/LiveSessionCalendar';
import { LiveSessionFormModal } from '@/features/teacher/live-sessions/components/LiveSessionFormModal';
import { LiveSessionListTable } from '@/features/teacher/live-sessions/components/LiveSessionListTable';
import type { LiveSessionEditorValues } from '@/features/teacher/live-sessions/schemas';
import {
  formatLiveSessionDateTime,
  formatLiveSessionTimeRange,
  toDateTimeLocalValue,
} from '@/features/teacher/live-sessions/utils';
import {
  QuizMetricCard,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type TeacherCourseLiveSessionsSectionProps = {
  courseId: string;
  courseTitle: string;
};

export function TeacherCourseLiveSessionsSection({
  courseId,
  courseTitle,
}: TeacherCourseLiveSessionsSectionProps) {
  const confirm = useConfirm();
  const [sessions, setSessions] = useState<TeacherLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TeacherLiveSession | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTeacherLiveSessionsByCourse(courseId);
        if (!active) return;
        setSessions(data);
      } catch (loadError) {
        if (!active) return;
        setError(
          getLiveSessionErrorMessage(
            loadError,
            'Unable to load live sessions for this course.',
          ),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [courseId, refreshKey]);

  const openCreateModal = () => {
    setEditingSession(null);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (session: TeacherLiveSession) => {
    setEditingSession(session);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingSession(null);
    setSubmitError(null);
  };

  const handleSubmit = async (values: LiveSessionEditorValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingSession) {
        await updateTeacherLiveSession(editingSession.id, values);
      } else {
        await createTeacherLiveSession(courseId, values);
      }

      setIsModalOpen(false);
      setEditingSession(null);
      setRefreshKey((value) => value + 1);
    } catch (submitActionError) {
      setSubmitError(
        getLiveSessionErrorMessage(
          submitActionError,
          editingSession
            ? 'Unable to update the live session.'
            : 'Unable to create the live session.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (session: TeacherLiveSession) => {
    const approved = await confirm({
      title: 'Cancel this live session?',
      description:
        'The session will stay visible in the course timeline as cancelled, but students will not be able to attend it.',
      variant: 'danger',
      confirmText: 'Cancel Session',
      cancelText: 'Keep Session',
    });

    if (!approved) return;

    setCancellingSessionId(session.id);
    setError(null);

    try {
      await cancelTeacherLiveSession(session.id);
      setRefreshKey((value) => value + 1);
    } catch (cancelError) {
      setError(
        getLiveSessionErrorMessage(cancelError, 'Unable to cancel the live session.'),
      );
    } finally {
      setCancellingSessionId(null);
    }
  };

  const orderedSessions = [...sessions].sort(
    (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
  );

  const now = Date.now();
  let scheduledCount = 0;
  let recordingEnabledCount = 0;
  let nextSession: TeacherLiveSession | null = null;

  for (const session of orderedSessions) {
    if (session.status === LIVE_SESSION_STATUS.scheduled) {
      scheduledCount += 1;
    }

    if (session.recordingEnabled) {
      recordingEnabledCount += 1;
    }

    if (
      !nextSession &&
      session.status !== LIVE_SESSION_STATUS.cancelled &&
      new Date(session.startTime).getTime() >= now
    ) {
      nextSession = session;
    }
  }

  const modalInitialValues = editingSession
    ? {
        title: editingSession.title,
        description: editingSession.description,
        startTimeLocal: toDateTimeLocalValue(editingSession.startTime),
        durationMinutes: editingSession.durationMinutes,
        recordingEnabled: editingSession.recordingEnabled,
        playbackEnabled: editingSession.playbackEnabled,
        meetingType: editingSession.meetingType ?? LIVE_SESSION_MEETING_TYPE.room,
        roomId: editingSession.roomId ?? editingSession.acsRoomId ?? '',
        groupId: editingSession.groupId ?? '',
        meetingLink: editingSession.meetingLink ?? '',
        meetingId: editingSession.meetingId ?? '',
        passcode: editingSession.passcode ?? '',
      }
    : undefined;

  const getClassroomHref = (session: TeacherLiveSession) =>
    `/teacher/dashboard/courses/${courseId}/live-sessions/${session.id}`;
  const getAttendanceHref = (session: TeacherLiveSession) =>
    `/teacher/dashboard/courses/${courseId}/live-sessions/${session.id}/attendance`;

  return (
    <>
      <QuizSectionCard
        title="Live Sessions"
        description={`Schedule and manage live teaching sessions for ${courseTitle}.`}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Course delivery schedule
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create, edit, and cancel course-scoped live sessions using the teacher live-session
                endpoints.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    viewMode === 'calendar'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Calendar
                </button>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
              >
                + Create Session
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <QuizMetricCard label="Sessions" value={String(orderedSessions.length)} />
            <QuizMetricCard label="Scheduled" value={String(scheduledCount)} />
            <QuizMetricCard
              label="Next Session"
              value={nextSession ? formatLiveSessionDateTime(nextSession.startTime) : '—'}
              hint={
                nextSession
                  ? `${formatLiveSessionTimeRange(
                      nextSession.startTime,
                      nextSession.durationMinutes,
                    )} · ${recordingEnabledCount} with recording`
                  : 'No upcoming sessions'
              }
            />
          </div>

          <ErrorAlert message={error ?? ''} />

          {isLoading ? (
            <QuizStatePanel
              title="Loading live sessions"
              message="Fetching the course schedule from the teacher live-session endpoints."
            />
          ) : error && orderedSessions.length === 0 ? (
            <QuizStatePanel
              title="Live sessions unavailable"
              message="The live-session schedule could not be loaded right now. Retry the request or return later."
              tone="error"
              action={
                <button
                  type="button"
                  onClick={() => setRefreshKey((value) => value + 1)}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
                >
                  Retry
                </button>
              }
            />
          ) : orderedSessions.length === 0 ? (
            <QuizStatePanel
              title="No live sessions scheduled"
              message="Create the first live session for this course to populate the list and calendar views."
              action={
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
                >
                  Create Session
                </button>
              }
            />
          ) : viewMode === 'calendar' ? (
            <LiveSessionCalendar
              sessions={orderedSessions}
              getClassroomHref={getClassroomHref}
              getAttendanceHref={getAttendanceHref}
            />
          ) : (
            <LiveSessionListTable
              sessions={orderedSessions}
              cancellingSessionId={cancellingSessionId}
              getClassroomHref={getClassroomHref}
              getAttendanceHref={getAttendanceHref}
              onEdit={openEditModal}
              onCancel={handleCancel}
            />
          )}
        </div>
      </QuizSectionCard>

      <LiveSessionFormModal
        open={isModalOpen}
        mode={editingSession ? 'edit' : 'create'}
        initialValues={modalInitialValues}
        isSubmitting={isSubmitting}
        error={submitError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
