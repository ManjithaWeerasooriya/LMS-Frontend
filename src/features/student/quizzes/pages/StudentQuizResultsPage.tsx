'use client';

import Link from 'next/link';
import { RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  getMyStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import {
  getStudentQuizzes,
  hasStudentQuizCompletedAttempt,
  StudentQuizApiError,
  type StudentQuizSummary,
} from '@/features/student/quizzes/api';
import { formatDateTime, formatMarks, formatPercentage } from '@/features/teacher/quizzes/utils';
import { logoutUser } from '@/lib/auth';

type StudentQuizResultsPageState = {
  loading: boolean;
  error: string | null;
  results: StudentQuizSummary[];
  coursesById: Record<string, StudentCourseListItem>;
};

const initialState: StudentQuizResultsPageState = {
  loading: true,
  error: null,
  results: [],
  coursesById: {},
};

const sortResults = (results: StudentQuizSummary[]) =>
  [...results].sort((left, right) => {
    const leftTime = new Date(left.submittedAt ?? left.startedAt ?? 0).getTime();
    const rightTime = new Date(right.submittedAt ?? right.startedAt ?? 0).getTime();

    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
  });

const buildCourseMap = (courses: StudentCourseListItem[]) =>
  Object.fromEntries(courses.map((course) => [course.id, course]));

const getCourseLabel = (
  quiz: StudentQuizSummary,
  coursesById: Record<string, StudentCourseListItem>,
) => {
  if (quiz.courseTitle?.trim()) {
    return quiz.courseTitle.trim();
  }

  if (quiz.courseId && coursesById[quiz.courseId]) {
    return coursesById[quiz.courseId].title;
  }

  return '—';
};

const renderScoreCell = (quiz: StudentQuizSummary) => {
  if (!quiz.areResultsPublished) {
    return <span className="text-sm text-slate-500">Results are not published yet</span>;
  }

  if (quiz.score == null) {
    return <span className="text-sm font-medium text-amber-700">Awaiting grading</span>;
  }

  return (
    <div>
      <p className="font-semibold text-slate-900">
        {formatMarks(quiz.score)}
        {quiz.totalMarks != null ? ` / ${formatMarks(quiz.totalMarks)}` : ''}
      </p>
      {quiz.percentage != null ? (
        <p className="text-xs text-slate-500">{formatPercentage(quiz.percentage)}</p>
      ) : null}
    </div>
  );
};

export default function StudentQuizResultsPage() {
  const router = useRouter();
  const [state, setState] = useState<StudentQuizResultsPageState>(initialState);

  const loadResults = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const [quizzes, courses] = await Promise.all([getStudentQuizzes(), getMyStudentCourses()]);
      const results = sortResults(quizzes.filter((quiz) => hasStudentQuizCompletedAttempt(quiz)));

      setState({
        loading: false,
        error: null,
        results,
        coursesById: buildCourseMap(courses),
      });
    } catch (loadError) {
      if (
        (loadError instanceof StudentApiError || loadError instanceof StudentQuizApiError) &&
        (loadError.status === 401 || loadError.status === 403)
      ) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error:
          loadError instanceof StudentApiError || loadError instanceof StudentQuizApiError
            ? loadError.message
            : 'Unable to load quiz results right now.',
      }));
    }
  }, [router]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Student Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Results</h1>
        <p className="text-sm text-slate-500">
          Review the assessments you have already completed and check whether your results have been published.
        </p>
      </header>

      {state.error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load quiz results.</p>
          <p className="mt-1">{state.error}</p>
          <button
            type="button"
            onClick={() => void loadResults()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Assessment</th>
                <th className="px-5 py-4">Course</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Result State</th>
                <th className="px-5 py-4">Score</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {state.loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`student-results-skeleton-${index + 1}`}>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="ml-auto h-9 w-20 animate-pulse rounded-2xl bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : state.results.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={6}>
                    <p className="text-base font-semibold text-slate-900">No attempted assessments yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Completed quizzes will appear here once you submit them.
                    </p>
                  </td>
                </tr>
              ) : (
                state.results.map((quiz) => {
                  const quizHref =
                    quiz.courseId ? `/student/dashboard/courses/${quiz.courseId}/quizzes/${quiz.id}` : null;

                  return (
                    <tr key={quiz.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{quiz.title}</p>
                        {quiz.submittedAt || quiz.startedAt ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Attempted {formatDateTime(quiz.submittedAt ?? quiz.startedAt)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {getCourseLabel(quiz, state.coursesById)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Attempted
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            quiz.areResultsPublished
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {quiz.areResultsPublished ? 'Published' : 'Not published'}
                        </span>
                      </td>
                      <td className="px-5 py-4">{renderScoreCell(quiz)}</td>
                      <td className="px-5 py-4 text-right">
                        {quizHref ? (
                          <Link
                            href={quizHref}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
