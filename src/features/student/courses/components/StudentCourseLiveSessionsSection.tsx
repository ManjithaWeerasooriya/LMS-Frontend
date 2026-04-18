'use client';

import Link from 'next/link';
import { CalendarDays, Radio } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  getStudentLiveSessionErrorMessage,
  getStudentLiveSessionsByCourse,
  type StudentLiveSession,
} from '@/features/student/live-sessions/api';
import { StudentCourseRecordingsSection } from '@/features/student/live-sessions/components/StudentCourseRecordingsSection';
import {
  formatDurationLabel,
  formatLiveClassroomDateTime,
  formatLiveClassroomTimeRange,
  getLiveClassroomStatusMeta,
} from '@/features/live-classroom/utils';
import { QuizMetricCard, QuizSectionCard, QuizStatePanel } from '@/features/teacher/quizzes/components/QuizShared';

type StudentCourseLiveSessionsSectionProps = {
  courseId: string;
};

export function StudentCourseLiveSessionsSection({
  courseId,
}: StudentCourseLiveSessionsSectionProps) {
  const [sessions, setSessions] = useState<StudentLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextSessions = await getStudentLiveSessionsByCourse(courseId);
        if (!active) {
          return;
        }
        setSessions(nextSessions);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(
          getStudentLiveSessionErrorMessage(
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

  const nextSession = useMemo(() => {
    const now = Date.now();
    return (
      sessions.find((session) => new Date(session.startTime).getTime() >= now) ?? sessions[0] ?? null
    );
  }, [sessions]);

  const handleRetry = () => {
    setRefreshKey((current) => current + 1);
  };

  return (
    <>
      <QuizSectionCard
        title="Live Sessions"
        description="Track upcoming classroom sessions and open the live classroom page when your teacher starts."
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <QuizMetricCard label="Sessions" value={String(sessions.length)} />
            <QuizMetricCard
              label="Next Session"
              value={nextSession ? formatLiveClassroomDateTime(nextSession.startTime) : '—'}
              hint={nextSession ? nextSession.title : 'No upcoming live sessions'}
            />
            <QuizMetricCard
              label="Duration"
              value={nextSession ? formatDurationLabel(nextSession.durationMinutes) : '—'}
              hint={
                nextSession
                  ? formatLiveClassroomTimeRange(
                      nextSession.startTime,
                      nextSession.durationMinutes,
                    )
                  : 'Waiting for schedule'
              }
            />
          </div>

          <ErrorAlert message={error ?? ''} />

          {isLoading ? (
            <QuizStatePanel
              title="Loading live sessions"
              message="Fetching the course live-session schedule."
            />
          ) : error && sessions.length === 0 ? (
            <QuizStatePanel
              title="Live sessions unavailable"
              message="The course live-session schedule could not be loaded right now."
              tone="error"
              action={
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
                >
                  Retry
                </button>
              }
            />
          ) : sessions.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No live sessions yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your teacher has not scheduled any live sessions for this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const status = getLiveClassroomStatusMeta(session.status);

                return (
                  <article
                    key={session.id}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                          {session.recordingEnabled ? (
                            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              Recording enabled
                            </span>
                          ) : null}
                        </div>

                        <p className="text-sm leading-6 text-slate-500">
                          {session.description || 'No session description provided.'}
                        </p>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                            <CalendarDays className="h-4 w-4 text-blue-700" />
                            {formatLiveClassroomDateTime(session.startTime)}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                            <Radio className="h-4 w-4 text-emerald-700" />
                            {formatLiveClassroomTimeRange(
                              session.startTime,
                              session.durationMinutes,
                            )}{' '}
                            · {formatDurationLabel(session.durationMinutes)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/student/dashboard/courses/${courseId}/live-sessions/${session.id}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
                        >
                          Open classroom
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </QuizSectionCard>

      <StudentCourseRecordingsSection
        courseId={courseId}
        sessions={sessions}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />
    </>
  );
}
