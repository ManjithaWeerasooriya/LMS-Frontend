'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  getTeacherQuizAttemptDetail,
  getTeacherQuizErrorMessage,
  manualGradeTeacherQuizAnswer,
} from '@/features/teacher/quizzes/api';
import { QuizAttemptReview } from '@/features/teacher/quizzes/components/QuizAttemptReview';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
} from '@/features/teacher/quizzes/components/QuizShared';
import type { TeacherQuizAttemptDetail } from '@/features/teacher/quizzes/types';
import { formatMarks, formatPercentage } from '@/features/teacher/quizzes/utils';

type TeacherQuizAttemptReviewPageProps = {
  courseId: string;
  quizId: string;
  attemptId: string;
};

export default function TeacherQuizAttemptReviewPage({
  courseId,
  quizId,
  attemptId,
}: TeacherQuizAttemptReviewPageProps) {
  const [attempt, setAttempt] = useState<TeacherQuizAttemptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getTeacherQuizAttemptDetail(quizId, attemptId);
      setAttempt(detail);
    } catch (loadError) {
      setError(getTeacherQuizErrorMessage(loadError, 'Unable to load this submission.'));
    } finally {
      setIsLoading(false);
    }
  }, [attemptId, quizId]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    if (!attempt) {
      return {
        answerCount: 0,
        pendingManual: 0,
      };
    }

    return {
      answerCount: attempt.answers.length,
      pendingManual: attempt.answers.filter((answer) => answer.needsManualGrading).length,
    };
  }, [attempt]);

  const handleGradeAnswer = async (
    answerId: string,
    value: { awardedMarks: number; teacherFeedback: string },
  ) => {
    setSavingAnswerId(answerId);
    setError(null);

    try {
      await manualGradeTeacherQuizAnswer(quizId, attemptId, answerId, value);
      setAttempt((current) => {
        if (!current) {
          return current;
        }

        const nextAnswers = current.answers.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                awardedMarks: value.awardedMarks,
                teacherFeedback: value.teacherFeedback,
                needsManualGrading: false,
              }
            : answer,
        );
        const nextScore = nextAnswers.reduce(
          (total, answer) => total + (answer.awardedMarks ?? 0),
          0,
        );
        const nextPendingManual = nextAnswers.filter((answer) => answer.needsManualGrading).length;

        return {
          ...current,
          answers: nextAnswers,
          score: nextScore,
          percentage: current.totalMarks > 0 ? (nextScore / current.totalMarks) * 100 : 0,
          answersPendingGrading: nextPendingManual,
          requiresManualGrading: nextPendingManual > 0,
        };
      });
      await load();
    } catch (gradeError) {
      setError(getTeacherQuizErrorMessage(gradeError, 'Unable to save the manual grade.'));
      throw gradeError;
    } finally {
      setSavingAnswerId(null);
    }
  };

  if (isLoading && !attempt) {
    return (
      <QuizSectionCard
        title="Loading submission"
        description="Fetching attempt details and answer records."
      >
        <p className="text-sm text-slate-500">Loading submission…</p>
      </QuizSectionCard>
    );
  }

  if (!attempt) {
    return (
      <QuizSectionCard
        title="Submission unavailable"
        description="This attempt could not be loaded."
      >
        <ErrorAlert message={error ?? 'Unable to load the attempt.'} />
      </QuizSectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Manual Grading"
        title={attempt.studentName}
        description={`Review answers for ${attempt.quizTitle} and save teacher-assigned marks.`}
        backHref={`/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/submissions`}
      >
        <BreadcrumbTrail
          items={[
            { label: 'Quiz Workspace', href: '/teacher/dashboard/quizzes' },
            { label: attempt.quizTitle, href: `/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/edit` },
            { label: 'Submissions', href: `/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/submissions` },
            { label: attempt.studentName },
          ]}
        />
      </QuizPageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <QuizMetricCard label="Status" value={attempt.status} />
        <QuizMetricCard
          label="Score"
          value={`${formatMarks(attempt.score)} / ${formatMarks(attempt.totalMarks)}`}
          hint={formatPercentage(attempt.percentage)}
        />
        <QuizMetricCard label="Answers" value={String(metrics.answerCount)} />
        <QuizMetricCard label="Pending Manual" value={String(metrics.pendingManual)} />
      </div>

      <ErrorAlert message={error ?? ''} />

      <QuizSectionCard
        title="Answer review"
        description="Short answer and essay responses can be graded manually inline."
      >
        <QuizAttemptReview
          key={`${attempt.id}-${attempt.score}-${attempt.answers.map((answer) => `${answer.id}:${answer.awardedMarks}:${answer.teacherFeedback}`).join('|')}`}
          attempt={attempt}
          savingAnswerId={savingAnswerId}
          error={null}
          onGradeAnswer={handleGradeAnswer}
        />
      </QuizSectionCard>
    </div>
  );
}
