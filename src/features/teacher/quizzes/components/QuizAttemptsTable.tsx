'use client';

import Link from 'next/link';

import { QuizStatePanel } from '@/features/teacher/quizzes/components/QuizShared';
import type { TeacherQuizAttemptSummary } from '@/features/teacher/quizzes/types';
import { formatDateTime, formatMarks, formatPercentage } from '@/features/teacher/quizzes/utils';

type QuizAttemptsTableProps = {
  courseId: string;
  quizId: string;
  attempts: TeacherQuizAttemptSummary[];
  isLoading?: boolean;
};

export function QuizAttemptsTable({
  courseId,
  quizId,
  attempts,
  isLoading = false,
}: QuizAttemptsTableProps) {
  if (isLoading) {
    return (
      <QuizStatePanel
        title="Loading submissions"
        message="Fetching the latest attempts submitted by students."
      />
    );
  }

  if (attempts.length === 0) {
    return (
      <QuizStatePanel
        title="No submissions yet"
        message="Student attempts will appear here once the quiz has been published and submitted."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Submitted</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Manual review</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{attempt.studentName}</p>
                    <p className="text-xs text-slate-500">
                      Started {formatDateTime(attempt.startedAt)}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      attempt.status.toLowerCase() === 'submitted'
                        ? 'bg-blue-50 text-blue-700'
                        : attempt.status.toLowerCase() === 'graded'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {attempt.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-700">{formatDateTime(attempt.submittedAt)}</td>
                <td className="px-6 py-4 text-slate-700">
                  {formatMarks(attempt.score)} / {formatMarks(attempt.totalMarks)} (
                  {formatPercentage(attempt.percentage)})
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {attempt.requiresManualGrading
                    ? `${attempt.answersPendingGrading} pending`
                    : 'Complete'}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/submissions/${attempt.id}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Open Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
