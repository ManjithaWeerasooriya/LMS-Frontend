'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, MonitorPlay } from 'lucide-react';

import {
  getStudentDashboard,
  type StudentDashboardCourse,
  type StudentDashboardLiveClass,
  type StudentDashboardQuiz,
  type StudentDashboardSummary,
} from '@/lib/student';

const initialSummary: StudentDashboardSummary = {
  enrolledCourses: 0,
  upcomingClasses: 0,
  pendingQuizzes: 0,
};

export default function StudentDashboardPage() {
  const [summary, setSummary] = useState<StudentDashboardSummary>(initialSummary);
  const [courses, setCourses] = useState<StudentDashboardCourse[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<StudentDashboardLiveClass[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<StudentDashboardQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getStudentDashboard();
        if (cancelled) return;

        setSummary(data.summary);
        setCourses(data.courses);
        setUpcomingClasses(data.upcomingClasses);
        setPendingQuizzes(data.pendingQuizzes);
      } catch {
        if (!cancelled) {
          setError('Unable to load dashboard. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    {
      label: 'Enrolled Courses',
      value: summary.enrolledCourses,
      iconBg: 'bg-blue-50 text-blue-600',
      Icon: BookOpen,
    },
    {
      label: 'Upcoming Classes',
      value: summary.upcomingClasses,
      iconBg: 'bg-violet-50 text-violet-600',
      Icon: MonitorPlay,
    },
    {
      label: 'Pending Quizzes',
      value: summary.pendingQuizzes,
      iconBg: 'bg-amber-50 text-amber-600',
      Icon: FileText,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
          Student Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Continue your learning journey.
        </p>

        {error ? (
          <p className="mt-3 text-sm text-rose-600">{error}</p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}
                >
                  <card.Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {loading ? '—' : card.value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            My Enrolled Courses
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500">
            You are not enrolled in any courses yet.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {courses.map((course) => (
              <article
                key={course.courseId}
                className="flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      {course.instructorName}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">
                      {course.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-800">
                    {Math.round(course.progressPercent)}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2F4EA2]"
                    style={{ width: `${Math.max(0, Math.min(100, course.progressPercent))}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Keep learning to see your progress grow over time.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163170]"
                  >
                    ▶ Continue Learning
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Upcoming Live Classes
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {upcomingClasses.length} Scheduled
              </span>
            </div>
            {upcomingClasses.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No upcoming live classes yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingClasses.map((session) => {
                  const scheduled = new Date(session.scheduledAt);
                  const dateLabel = scheduled.toLocaleDateString();
                  const timeLabel = scheduled.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={session.liveClassId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {session.topic}
                        </p>
                        <p className="text-xs text-slate-500">
                          {session.courseTitle ?? 'Live Class'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateLabel} · {timeLabel}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {session.durationMinutes ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {session.durationMinutes} min
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#163170]"
                        >
                          Join Class
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Pending Quizzes
              </h2>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {pendingQuizzes.length} Pending
              </span>
            </div>
            {pendingQuizzes.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                You don&apos;t have any pending quizzes right now.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {pendingQuizzes.map((quiz) => (
                  <div
                    key={quiz.quizId}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {quiz.title}
                      </p>
                      <p className="text-xs text-slate-600">
                        {quiz.courseTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {quiz.durationMinutes} min
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#3B82F6] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2563EB]"
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

