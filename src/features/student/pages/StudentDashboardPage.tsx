'use client';

import Link from 'next/link';
import { BookOpen, ClipboardList, MonitorPlay } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { logoutUser } from '@/lib/auth';
import {
  formatDurationLabel,
  formatLiveClassroomDateTime,
  getLiveClassroomStatusMeta,
} from '@/features/live-classroom/utils';
import {
  getStudentDashboard,
  StudentApiError,
  type StudentDashboardCourse,
  type StudentDashboardLiveSession,
  type StudentDashboardQuiz,
  type StudentDashboardSummary,
} from '@/features/student/api/student';

type DashboardState = {
  summary: StudentDashboardSummary | null;
  myCourses: StudentDashboardCourse[];
  upcomingLiveSessions: StudentDashboardLiveSession[];
  pendingQuizzes: StudentDashboardQuiz[];
  loading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  summary: null,
  myCourses: [],
  upcomingLiveSessions: [],
  pendingQuizzes: [],
  loading: true,
  error: null,
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>(initialState);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const data = await getStudentDashboard();
        if (!active) return;

        setState({
          summary: data.summary,
          myCourses: data.myCourses,
          upcomingLiveSessions: data.upcomingLiveSessions,
          pendingQuizzes: data.pendingQuizzes,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;

        if (error instanceof StudentApiError && (error.status === 401 || error.status === 403)) {
          await logoutUser();
          router.replace('/login');
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof StudentApiError
              ? error.message
              : 'Unable to load student dashboard.',
        }));
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const summaryCards = [
    {
      title: 'Enrolled Courses',
      value: state.summary?.enrolledCourses ?? '—',
      accent: 'bg-blue-100 text-blue-700',
      icon: BookOpen,
    },
    {
      title: 'Upcoming Live Sessions',
      value: state.summary?.upcomingLiveSessions ?? '—',
      accent: 'bg-emerald-100 text-emerald-700',
      icon: MonitorPlay,
    },
    {
      title: 'Pending Quizzes',
      value: state.summary?.pendingQuizzes ?? '—',
      accent: 'bg-amber-100 text-amber-700',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Student Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">
          Follow your courses, upcoming live sessions, and pending quizzes in one place.
        </p>
      </header>

      {state.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {card.title}
                </p>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {state.loading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded-xl bg-slate-200" />
                ) : (
                  card.value
                )}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Courses</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">My Courses</h2>
            </div>
            <Link
              href="/student/dashboard/courses"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open all
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {state.loading ? (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                        Loading courses…
                      </td>
                    </tr>
                  ) : state.myCourses.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                        No enrolled courses yet.
                      </td>
                    </tr>
                  ) : (
                    state.myCourses.map((course) => (
                      <tr key={course.courseId || course.title}>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {course.courseId ? (
                            <Link
                              href={`/student/dashboard/courses/${course.courseId}`}
                              className="transition hover:text-[#1B3B8B]"
                            >
                              {course.title}
                            </Link>
                          ) : (
                            course.title
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{course.instructorName ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#1B3B8B]"
                                style={{ width: `${Math.max(0, Math.min(100, course.progressPercent))}%` }}
                              />
                            </div>
                            <span>{course.progressPercent.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Live Sessions</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Upcoming Live Sessions</h2>
            <div className="mt-4 space-y-3">
              {state.loading ? (
                <p className="text-sm text-slate-500">Loading live sessions…</p>
              ) : state.upcomingLiveSessions.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming live sessions scheduled.</p>
              ) : (
                state.upcomingLiveSessions.map((session) => {
                  const status = getLiveClassroomStatusMeta(session.status);
                  const content = (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{session.title}</p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.courseTitle ?? 'General Session'}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Start Time {formatLiveClassroomDateTime(session.startTime)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {session.durationMinutes
                          ? formatDurationLabel(session.durationMinutes)
                          : 'Duration to be announced'}
                      </p>
                    </div>
                  );

                  return session.courseId ? (
                    <Link
                      key={session.id || `${session.title}-${session.startTime}`}
                      href={`/student/dashboard/courses/${session.courseId}/live-sessions/${session.id}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={session.id || `${session.title}-${session.startTime}`}>{content}</div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Assessments</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Pending Quizzes</h2>
            <div className="mt-4 space-y-3">
              {state.loading ? (
                <p className="text-sm text-slate-500">Loading quizzes…</p>
              ) : state.pendingQuizzes.length === 0 ? (
                <p className="text-sm text-slate-500">No pending quizzes right now.</p>
              ) : (
                state.pendingQuizzes.map((quiz) => (
                  <div key={quiz.quizId || `${quiz.title}-${quiz.courseTitle}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{quiz.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{quiz.courseTitle ?? 'Course pending'}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Duration: {quiz.durationMinutes > 0 ? `${quiz.durationMinutes} minutes` : 'TBA'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
