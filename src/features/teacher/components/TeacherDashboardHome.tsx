'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ClipboardList, MonitorPlay, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getTeacherCourseById,
  getTeacherDashboard,
  type CompletionRate,
  type DashboardCourse,
  type PendingSubmission,
  type PerformanceSlice,
  type TeacherDashboardLiveSession,
  type TeacherCourseDetail,
  type TeacherDashboardSummary,
} from '@/features/teacher/api/teacher';
import {
  formatDurationMinutes,
  formatLiveSessionDateTime,
  getLiveSessionStatusMeta,
} from '@/features/teacher/live-sessions/utils';

import {
  CreateCourseModal,
  type CreateCourseModalProps,
} from '@/features/teacher/components/CreateCourseModal';
import {
  CreateQuizModal,
  type CreateQuizModalProps,
} from '@/features/teacher/components/CreateQuizModal';
import {
  ScheduleLiveSessionModal,
  type ScheduleLiveSessionModalProps,
} from '@/features/teacher/components/ScheduleLiveSessionModal';

type DashboardState = {
  summary: TeacherDashboardSummary | null;
  performance: PerformanceSlice[];
  completion: CompletionRate[];
  sessions: TeacherDashboardLiveSession[];
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

export function TeacherDashboardHome() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>(initialState);
  const [dashboardCourses, setDashboardCourses] = useState<DashboardCourse[]>([]);
  const [openCourseModal, setOpenCourseModal] =
    useState<CreateCourseModalProps['open']>(false);
  const [openQuizModal, setOpenQuizModal] =
    useState<CreateQuizModalProps['open']>(false);
  const [openLiveSessionModal, setOpenLiveSessionModal] =
    useState<ScheduleLiveSessionModalProps['open']>(false);
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TeacherCourseDetail | null>(null);

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
      accent: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Students',
      value: state.summary?.totalStudents?.toLocaleString() ?? '—',
      accent: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Pending Submissions',
      value: state.summary?.pendingSubmissions ?? '—',
      accent: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Live Sessions',
      value: state.summary?.upcomingLiveSessions ?? '—',
      accent: 'bg-violet-100 text-violet-600',
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

  const handleViewCourse = (courseId: string) => {
    if (!courseId) return;
    router.push('/teacher/dashboard/courses');
  };

  const handleEditCourse = async (courseId: string) => {
    if (!courseId) return;
    try {
      const fullCourse = await getTeacherCourseById(courseId);
      setEditCourse(fullCourse);
      setEditCourseModalOpen(true);
    } catch {
      // Could surface a toast here in the future.
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">
          Teacher Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Teacher Dashboard
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
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}
                  aria-hidden="true"
                >
                  {card.title === 'My Courses' ? (
                    <BookOpen className="h-5 w-5" />
                  ) : card.title === 'Total Students' ? (
                    <Users className="h-5 w-5" />
                  ) : card.title === 'Pending Submissions' ? (
                    <ClipboardList className="h-5 w-5" />
                  ) : (
                    <MonitorPlay className="h-5 w-5" />
                  )}
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
            onClick={() => setOpenLiveSessionModal(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-[#1B3B8B] px-4 py-2 text-sm font-semibold text-[#1B3B8B] transition hover:bg-blue-50"
          >
            + Schedule Live Session
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Performance</p>
            <h2 className="text-xl font-semibold text-slate-900">Course Performance</h2>
          </div>
          {state.error ? (
            <p className="text-sm font-semibold text-rose-600">{state.error}</p>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student Performance by Course
            </p>
            <div className="mt-4 h-72">
              {state.loading ? (
                <div className="h-full animate-pulse rounded-3xl bg-slate-200" />
              ) : state.performance.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 text-sm text-slate-500">
                  No performance data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={state.performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#2F7FF8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completion Rate
            </p>
            <div className="mt-4 h-72">
              {state.loading ? (
                <div className="h-full animate-pulse rounded-3xl bg-slate-200" />
              ) : state.completion.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 text-sm text-slate-500">
                  No completion data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={state.completion}
                      dataKey="percent"
                      nameKey="courseTitle"
                      cx="50%"
                      cy="50%"
                      outerRadius={92}
                      label
                    >
                      {state.completion.map((slice, index) => (
                        <Cell
                          key={slice.courseId}
                          fill={performanceColors[index % performanceColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Live Sessions</p>
              <h2 className="text-xl font-semibold text-slate-900">Upcoming Live Sessions</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard/live-sessions')}
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Manage
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {state.loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))
            ) : state.sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No upcoming live sessions scheduled.
              </div>
            ) : (
              state.sessions.slice(0, 4).map((session) => {
                const status = getLiveSessionStatusMeta(session.status);

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {session.courseTitle ?? 'Live Session'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Start Time {formatLiveSessionDateTime(session.startTime)}
                        {session.durationMinutes ? ` · ${formatDurationMinutes(session.durationMinutes)}` : ''}
                        {` · ${session.studentsEnrolled} students`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          session.courseId
                            ? `/teacher/dashboard/courses/${session.courseId}`
                            : '/teacher/dashboard/live-sessions',
                        )
                      }
                      className="rounded-2xl bg-[#1B3B8B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#17306f]"
                    >
                      Manage
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Submissions</p>
              <h2 className="text-xl font-semibold text-slate-900">Pending Reviews</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard/quizzes')}
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Open Quizzes
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {state.loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))
            ) : state.submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No submissions need review right now.
              </div>
            ) : (
              state.submissions.slice(0, 4).map((submission) => (
                <div
                  key={submission.assignmentId}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{submission.assignmentTitle}</p>
                    <p className="text-xs text-slate-500">
                      {submission.courseTitle} · Due {new Date(submission.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {submission.pendingCount}/{submission.totalCount} pending
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Courses</p>
            <h2 className="text-xl font-semibold text-slate-900">Top Courses</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push('/teacher/dashboard/courses')}
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
          >
            View All
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {state.loading ? (
                  <tr>
                    <td className="px-4 py-5 text-center text-slate-500" colSpan={5}>
                      Loading courses…
                    </td>
                  </tr>
                ) : topCourses.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-center text-slate-500" colSpan={5}>
                      No course data available.
                    </td>
                  </tr>
                ) : (
                  topCourses.map((course) => (
                    <tr key={course.courseId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">{course.title}</td>
                      <td className="px-4 py-3 text-slate-700">{course.students}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {course.averageProgressPercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-slate-700">{course.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewCourse(course.courseId)}
                            className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditCourse(course.courseId)}
                            className="rounded-2xl border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CreateCourseModal
        open={openCourseModal}
        onClose={() => setOpenCourseModal(false)}
        mode="create"
        onSaved={refreshDashboard}
      />
      <CreateCourseModal
        open={editCourseModalOpen}
        onClose={() => setEditCourseModalOpen(false)}
        mode="edit"
        initialCourse={editCourse ?? undefined}
        onSaved={refreshDashboard}
      />
      <CreateQuizModal
        open={openQuizModal}
        onClose={() => setOpenQuizModal(false)}
      />
      <ScheduleLiveSessionModal
        open={openLiveSessionModal}
        onClose={() => setOpenLiveSessionModal(false)}
        onScheduled={refreshDashboard}
      />
    </div>
  );
}
