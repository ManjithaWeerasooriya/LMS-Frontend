'use client';

import { useEffect, useState } from 'react';

import { ScheduleLiveClassModal } from '@/features/teacher/components/ScheduleLiveClassModal';
import { getTeacherLiveSessions, type LiveSession } from '@/features/teacher/api/teacher';

export default function TeacherLiveClassesPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getTeacherLiveSessions();
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const data = await getTeacherLiveSessions();
        if (!isMounted) return;
        setSessions(data);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">
            Live Classes
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Live Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule and manage upcoming live sessions for your students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
        >
          + Schedule Live Class
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading live sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            You don&apos;t have any upcoming live sessions. Schedule one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const scheduled = new Date(session.scheduledAt);
              const dateLabel = scheduled.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const timeLabel = scheduled.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      🎥
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{session.topic}</p>
                      <p className="text-xs text-slate-500">
                        {dateLabel} · {timeLabel} · {session.studentsEnrolled} students
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!session.meetingLink) return;
                      window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
                    }}
                    className="rounded-2xl bg-[#1B3B8B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#17306f]"
                  >
                    Join
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ScheduleLiveClassModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onScheduled={refreshSessions}
      />
    </div>
  );
}
