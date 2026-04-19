'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  getLiveClassroomErrorMessage,
  getTeacherLiveSessionAttendance,
  type LiveSessionAttendanceSummary,
} from '@/features/live-classroom/api';
import { LiveSessionAttendanceSummaryView } from '@/features/live-classroom/components/LiveSessionAttendanceSummaryView';
import {
  formatDurationLabel,
  formatLiveClassroomDateTime,
  getLiveClassroomStatusMeta,
} from '@/features/live-classroom/utils';
import {
  getLiveSessionErrorMessage,
  getTeacherLiveSessionById,
  type TeacherLiveSession,
} from '@/features/teacher/live-sessions/api';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type TeacherLiveSessionAttendancePageProps = {
  courseId: string;
  sessionId: string;
};

export default function TeacherLiveSessionAttendancePage({
  courseId,
  sessionId,
}: TeacherLiveSessionAttendancePageProps) {
  const [session, setSession] = useState<TeacherLiveSession | null>(null);
  const [summary, setSummary] = useState<LiveSessionAttendanceSummary | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const backHref = `/teacher/dashboard/courses/${courseId}`;
  const classroomHref = `${backHref}/live-sessions/${sessionId}`;

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);
    setSessionError(null);

    try {
      const nextSession = await getTeacherLiveSessionById(courseId, sessionId);
      setSession(nextSession);
    } catch (loadError) {
      setSessionError(
        getLiveSessionErrorMessage(loadError, 'Unable to load this live session.'),
      );
    } finally {
      setIsSessionLoading(false);
    }
  }, [courseId, sessionId]);

  const loadAttendance = useCallback(async () => {
    setIsAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const nextSummary = await getTeacherLiveSessionAttendance(sessionId);
      setSummary(nextSummary);
    } catch (loadError) {
      setAttendanceError(
        getLiveClassroomErrorMessage(loadError, 'Unable to load attendance for this session.'),
      );
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [sessionId]);

  const refreshPage = useCallback(async () => {
    await Promise.all([loadSession(), loadAttendance()]);
  }, [loadAttendance, loadSession]);

  useEffect(() => {
    void refreshPage();
  }, [refreshPage]);

  const title = session?.title ?? summary?.sessionTitle ?? 'Live session attendance';
  const courseTitle = session?.courseTitle ?? summary?.courseTitle ?? 'Course';
  const sessionStatus = session ? getLiveClassroomStatusMeta(session.status) : null;
  const headerActions = [
    ...(session || summary
      ? [
          {
            label: 'Open Classroom',
            href: classroomHref,
            variant: 'secondary' as const,
          },
        ]
      : []),
    {
      label: 'Refresh',
      onClick: () => void refreshPage(),
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Attendance"
        title={isSessionLoading && !session ? 'Loading attendance…' : title}
        description="Review session attendance by student, including join and leave times, duration, and attendance status."
        backHref={backHref}
        actions={headerActions}
      >
        <BreadcrumbTrail
          items={[
            { label: 'Courses', href: '/teacher/dashboard/courses' },
            { label: courseTitle, href: backHref },
            { label: title },
            { label: 'Attendance' },
          ]}
        />
      </QuizPageHeader>

      <ErrorAlert message={sessionError ?? ''} />

      {isSessionLoading && !session ? (
        <QuizStatePanel
          title="Loading attendance"
          message="Fetching the live session and attendance summary."
        />
      ) : !session && sessionError ? (
        <QuizStatePanel
          title="Session unavailable"
          message="This live session could not be loaded. Return to the course page and try again."
          tone="error"
          action={
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
            >
              Back to course
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <QuizMetricCard
              label="Status"
              value={sessionStatus?.label ?? '—'}
              hint={courseTitle}
            />
            <QuizMetricCard
              label="Start"
              value={
                session
                  ? formatLiveClassroomDateTime(session.startTime)
                  : summary
                    ? formatLiveClassroomDateTime(summary.startTime)
                    : '—'
              }
            />
            <QuizMetricCard
              label="Duration"
              value={
                session
                  ? formatDurationLabel(session.durationMinutes)
                  : summary
                    ? formatDurationLabel(summary.durationMinutes)
                    : '—'
              }
            />
          </div>

          <QuizSectionCard
            title="Attendance Summary"
            description="Track participation for this session using the teacher attendance endpoint."
          >
            <LiveSessionAttendanceSummaryView
              isLoading={isAttendanceLoading}
              error={attendanceError}
              summary={summary}
              onRefresh={() => void loadAttendance()}
            />
          </QuizSectionCard>
        </>
      )}
    </div>
  );
}
