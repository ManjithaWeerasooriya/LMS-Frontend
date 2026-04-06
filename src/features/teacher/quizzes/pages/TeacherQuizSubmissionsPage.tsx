'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  getTeacherQuizAttempts,
  getTeacherQuizById,
  getTeacherQuizErrorMessage,
  publishTeacherQuizResults,
  unpublishTeacherQuizResults,
} from '@/features/teacher/quizzes/api';
import { QuizAttemptsTable } from '@/features/teacher/quizzes/components/QuizAttemptsTable';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatusBadge,
} from '@/features/teacher/quizzes/components/QuizShared';
import type {
  TeacherQuizAttemptSummary,
  TeacherQuizDetail,
} from '@/features/teacher/quizzes/types';
import { formatPercentage } from '@/features/teacher/quizzes/utils';

type TeacherQuizSubmissionsPageProps = {
  courseId: string;
  quizId: string;
};

export default function TeacherQuizSubmissionsPage({
  courseId,
  quizId,
}: TeacherQuizSubmissionsPageProps) {
  const [quiz, setQuiz] = useState<TeacherQuizDetail | null>(null);
  const [attempts, setAttempts] = useState<TeacherQuizAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingResults, setIsTogglingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [quizDetail, quizAttempts] = await Promise.all([
        getTeacherQuizById(quizId),
        getTeacherQuizAttempts(quizId),
      ]);

      setQuiz(quizDetail);
      setAttempts(quizAttempts);
    } catch (loadError) {
      setError(getTeacherQuizErrorMessage(loadError, 'Unable to load quiz submissions.'));
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const pendingManual = attempts.reduce(
      (total, attempt) => total + attempt.answersPendingGrading,
      0,
    );
    const average =
      attempts.length > 0
        ? attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length
        : quiz?.averageScorePercent ?? 0;

    return {
      attemptCount: attempts.length,
      pendingManual,
      average,
    };
  }, [attempts, quiz]);

  const handleToggleResults = async () => {
    if (!quiz) return;

    setIsTogglingResults(true);
    setError(null);

    try {
      if (quiz.areResultsPublished) {
        await unpublishTeacherQuizResults(quizId);
      } else {
        await publishTeacherQuizResults(quizId);
      }

      await load();
    } catch (toggleError) {
      setError(
        getTeacherQuizErrorMessage(toggleError, 'Unable to update result publishing state.'),
      );
    } finally {
      setIsTogglingResults(false);
    }
  };

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Submission Review"
        title={quiz?.title ?? 'Quiz submissions'}
        description="Open individual attempts to review answers and manually grade written responses."
        backHref={`/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/edit`}
        actions={
          quiz
            ? [
                {
                  label: quiz.areResultsPublished ? 'Unpublish Results' : 'Publish Results',
                  onClick: handleToggleResults,
                  variant: 'secondary',
                  disabled: isTogglingResults,
                },
              ]
            : undefined
        }
      >
        <BreadcrumbTrail
          items={[
            { label: 'Quiz Workspace', href: '/teacher/dashboard/quizzes' },
            { label: quiz?.courseTitle ?? 'Course', href: `/teacher/dashboard/courses/${courseId}/quizzes` },
            {
              label: quiz?.title ?? 'Quiz',
              href: `/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/edit`,
            },
            { label: 'Submissions' },
          ]}
        />
      </QuizPageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <QuizMetricCard label="Attempts" value={String(metrics.attemptCount)} />
        <QuizMetricCard
          label="Average Score"
          value={metrics.attemptCount > 0 ? formatPercentage(metrics.average) : '—'}
        />
        <QuizMetricCard label="Manual Queue" value={String(metrics.pendingManual)} />
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Result visibility
          </p>
          <div className="mt-3">
            <QuizStatusBadge
              isPublished={quiz?.isPublished ?? false}
              areResultsPublished={quiz?.areResultsPublished ?? false}
            />
          </div>
        </div>
      </div>

      <ErrorAlert message={error ?? ''} />

      <QuizSectionCard
        title="Student attempts"
        description="Each attempt can be opened for answer-by-answer review and manual grading."
      >
        <QuizAttemptsTable
          courseId={courseId}
          quizId={quizId}
          attempts={attempts}
          isLoading={isLoading}
        />
      </QuizSectionCard>
    </div>
  );
}
