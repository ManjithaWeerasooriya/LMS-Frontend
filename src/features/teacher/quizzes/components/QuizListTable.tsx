'use client';

import Link from 'next/link';
import { FileSearch, PencilLine, Trash2 } from 'lucide-react';

import { QuizStatusBadge } from '@/features/teacher/quizzes/components/QuizShared';
import type { TeacherQuizSummary } from '@/features/teacher/quizzes/types';
import { formatDateTime, formatPercentage } from '@/features/teacher/quizzes/utils';

type QuizListTableProps = {
  courseId: string;
  quizzes: TeacherQuizSummary[];
  isLoading?: boolean;
  emptyMessage?: string;
  deletingQuizId?: string | null;
  togglingResultsQuizId?: string | null;
  onDelete: (quiz: TeacherQuizSummary) => void;
  onToggleResults: (quiz: TeacherQuizSummary) => void;
};

export function QuizListTable({
  courseId,
  quizzes,
  isLoading = false,
  emptyMessage = 'No quizzes yet.',
  deletingQuizId,
  togglingResultsQuizId,
  onDelete,
  onToggleResults,
}: QuizListTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Quiz</th>
              <th className="px-6 py-3">Schedule</th>
              <th className="px-6 py-3">Marks</th>
              <th className="px-6 py-3">Questions</th>
              <th className="px-6 py-3">Submissions</th>
              <th className="px-6 py-3">Average</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={8}>
                  Loading quizzes…
                </td>
              </tr>
            ) : quizzes.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={8}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              quizzes.map((quiz) => (
                <tr key={quiz.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{quiz.title}</p>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {quiz.durationMinutes} min
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <p>{formatDateTime(quiz.startTimeUtc)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Ends: {formatDateTime(quiz.endTimeUtc)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{quiz.totalMarks || '—'}</td>
                  <td className="px-6 py-4 text-slate-700">{quiz.questionCount}</td>
                  <td className="px-6 py-4 text-slate-700">{quiz.submissionCount}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {quiz.submissionCount > 0 ? formatPercentage(quiz.averageScorePercent) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <QuizStatusBadge
                      isPublished={quiz.isPublished}
                      areResultsPublished={quiz.areResultsPublished}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/teacher/dashboard/courses/${courseId}/quizzes/${quiz.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Link>
                      <Link
                        href={`/teacher/dashboard/courses/${courseId}/quizzes/${quiz.id}/submissions`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FileSearch className="h-4 w-4" />
                        Review
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggleResults(quiz)}
                        disabled={togglingResultsQuizId === quiz.id}
                        className="inline-flex items-center rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {togglingResultsQuizId === quiz.id
                          ? 'Updating…'
                          : quiz.areResultsPublished
                            ? 'Unpublish Results'
                            : 'Publish Results'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(quiz)}
                        disabled={deletingQuizId === quiz.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingQuizId === quiz.id ? 'Deleting…' : 'Delete'}
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
  );
}
