'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { getTeacherAllLiveSessions } from '@/features/teacher/api/teacher';
import { ScheduleLiveSessionModal } from '@/features/teacher/components/ScheduleLiveSessionModal';
import type { TeacherLiveSession } from '@/features/teacher/live-sessions/api';
import {
  formatDurationMinutes,
  formatLiveSessionDateTime,
  getLiveSessionStatusMeta,
} from '@/features/teacher/live-sessions/utils';

export default function TeacherLiveSessionsPage() {
  const [sessions, setSessions] = useState<TeacherLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const refreshSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTeacherAllLiveSessions();
      setSessions(data);
    } catch {
      setError('Unable to load live sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTeacherAllLiveSessions();
        if (!active) return;
        setSessions(data);
      } catch {
        if (!active) return;
        setError('Unable to load live sessions.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Live Sessions</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Live Sessions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review scheduled, live, and completed sessions across your courses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
        >
          + Schedule Live Session
        </button>
      </header>

      <ErrorAlert message={error ?? ''} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading live sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No live sessions found yet. Schedule one to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const status = getLiveSessionStatusMeta(session.status);
              const courseHref = `/teacher/dashboard/courses/${session.courseId}`;
              const classroomHref = `${courseHref}/live-sessions/${session.id}`;
              const attendanceHref = `${classroomHref}/attendance`;

              return (
                <article
                  key={session.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{session.title}</h2>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500">{session.courseTitle}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>Start Time: {formatLiveSessionDateTime(session.startTime)}</span>
                        <span>Duration: {formatDurationMinutes(session.durationMinutes)}</span>
                        <span>
                          Recording: {session.recordingEnabled ? 'Enabled' : 'Off'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={courseHref}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Course
                      </Link>
                      <Link
                        href={classroomHref}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#17306f]"
                      >
                        Classroom
                      </Link>
                      <Link
                        href={attendanceHref}
                        className="inline-flex items-center justify-center rounded-2xl border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        Attendance
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ScheduleLiveSessionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onScheduled={refreshSessions}
      />
    </div>
  );
}
