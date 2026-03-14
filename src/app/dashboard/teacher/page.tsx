'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

import {
  getTeacherDashboard,
  type CompletionRate,
  type DashboardCourse,
  type LiveSession,
  type PendingSubmission,
  type PerformanceSlice,
  type TeacherDashboardSummary,
} from '@/lib/teacher';

import {
  CreateCourseModal,
  type CreateCourseModalProps,
} from './_components/CreateCourseModal';
import {
  CreateQuizModal,
  type CreateQuizModalProps,
} from './_components/CreateQuizModal';
import { ScheduleLiveClassModal, type ScheduleLiveClassModalProps } from './_components/ScheduleLiveClassModal';

type DashboardState = {
  summary: TeacherDashboardSummary | null;
  performance: PerformanceSlice[];
  completion: CompletionRate[];
  sessions: LiveSession[];
  submissions: PendingSubmission[];
  loading: boolean;
  error?: string | null;
};

const initialState: DashboardState = {
  summary: null,
  performance: [],
  completion: [],
  sessions: [],
  submissions: [],
  loading: true,
  error: null,
};

const performanceColors = ['#22c55e', '#3b82f6', '#f97316', '#ef4444'];

export default function TeacherDashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [dashboardCourses, setDashboardCourses] = useState<DashboardCourse[]>([]);
  const [openCourseModal, setOpenCourseModal] =
    useState<CreateCourseModalProps['open']>(false);
  const [openQuizModal, setOpenQuizModal] =
    useState<CreateQuizModalProps['open']>(false);
  const [openLiveClassModal, setOpenLiveClassModal] =
    useState<ScheduleLiveClassModalProps['open']>(false);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const { summary, courses, performance, completion, sessions, submissions } =
          await getTeacherDashboard();

        if (!isMounted) return;

        setDashboardCourses(courses);
        setState({
          summary,
          performance,
          completion,
          sessions,
          submissions,
          loading: false,
          error: null,
        });
      } catch {
        if (!isMounted) return;
        setState((prev) => ({ ...prev, loading: false, error: 'Unable to load dashboard.' }));
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryCards = [
    {
      title: 'My Courses',
      value: state.summary?.myCourses ?? '—',
      accent: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Total Students',
      value: state.summary?.totalStudents?.toLocaleString() ?? '—',
      accent: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Pending Submissions',
      value: state.summary?.pendingSubmissions ?? '—',
      accent: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Live Sessions',
      value: state.summary?.upcomingLiveSessions ?? '—',
      accent: 'bg-purple-100 text-purple-700',
    },
  ];

  const topCourses = dashboardCourses.slice(0, 3);

  const refreshDashboard = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { summary, courses, performance, completion, sessions, submissions } =
        await getTeacherDashboard();
      setDashboardCourses(courses);
      setState({
        summary,
        performance,
        completion,
        sessions,
        submissions,
        loading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Unable to load dashboard.' }));
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">
          Instructor Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Instructor Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Manage your courses and track student performance.
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {card.title}
                </p>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-semibold ${card.accent}`}
                >
                  {card.title === 'My Courses'
                    ? '📘'
                    : card.title === 'Total Students'
                    ? '👥'
                    : card.title === 'Pending Submissions'
                    ? '📝'
                    : '🎥'}
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
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setOpenCourseModal(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
          >
            + Create Course
          </button>
          <button
            type="button"
            onClick={() => setOpenQuizModal(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#2F7FF8] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#2563eb]"
          >
            + Create Quiz
          </button>
          <button
            type="button"
            onClick={() => setOpenLiveClassModal(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-[#1B3B8B] px-4 py-2 text-sm font-semibold text-[#1B3B8B] transition hover:bg-blue-50"
          >
            + Schedule Live Class
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">My Courses</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {topCourses.map((course) => (
            <article
              key={course.courseId}
              className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {course.students} students enrolled
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold ${
                    course.status.toLowerCase() === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {course.status}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Course Progress</span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(course.averageProgressPercent)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#1B3B8B]"
                    style={{
                      width: `${Math.min(Math.max(course.averageProgressPercent, 0), 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#2F7FF8] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2563eb]"
                  >
                    View Course
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#1B3B8B] px-4 py-2 text-xs font-semibold text-[#1B3B8B] transition hover:bg-blue-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </article>
          ))}
          {topCourses.length === 0 && !state.loading ? (
            <p className="text-sm text-slate-500">
              You don&apos;t have any courses yet. Create your first course to
              get started.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Student Performance Distribution
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={state.performance}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {state.performance.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={entry.color || performanceColors[index] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">
              {state.performance.map((slice) => (
                <li key={slice.label} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {slice.label}:
                    </span>{' '}
                    {slice.value}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Course Completion Rates
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.completion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="courseTitle"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Completion']} />
                <Bar dataKey="percent" fill="#1B3B8B" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              Upcoming Live Sessions
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {state.sessions.map((session) => {
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
                      <p className="text-sm font-semibold text-slate-900">
                        {session.topic}
                      </p>
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
            {state.sessions.length === 0 && !state.loading ? (
              <p className="text-sm text-slate-500">
                You have no upcoming live sessions scheduled.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Pending Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Review assignments and quizzes awaiting grading.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {state.summary?.pendingSubmissions ?? 0} Total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {state.submissions.map((submission) => {
              const due = new Date(submission.dueDate);
              const dueLabel = due.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={submission.assignmentId}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {submission.assignmentTitle}
                    </p>
                    <p className="text-xs text-slate-500">{submission.courseTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Due: {dueLabel}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[0.7rem] font-semibold text-amber-700">
                      {submission.pendingCount} pending
                    </span>
                    <button
                      type="button"
                      className="rounded-2xl bg-[#2F7FF8] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2563eb]"
                    >
                      Review Submissions
                    </button>
                  </div>
                </div>
              );
            })}
            {state.submissions.length === 0 && !state.loading ? (
              <p className="text-sm text-slate-500">
                Great job! You don&apos;t have any pending submissions.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <CreateCourseModal open={openCourseModal} onClose={() => setOpenCourseModal(false)} />
      <CreateQuizModal open={openQuizModal} onClose={() => setOpenQuizModal(false)} />
      <ScheduleLiveClassModal
        open={openLiveClassModal}
        onClose={() => setOpenLiveClassModal(false)}
        onScheduled={refreshDashboard}
      />
    </div>
  );
}
