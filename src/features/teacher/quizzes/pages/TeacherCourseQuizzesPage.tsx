'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { useConfirm } from '@/context/ConfirmContext';
import { getTeacherCourseById } from '@/features/teacher/api/teacher';
import {
  deleteTeacherQuiz,
  getTeacherQuizzesByCourse,
  getTeacherQuizErrorMessage,
  publishTeacherQuizResults,
  unpublishTeacherQuizResults,
} from '@/features/teacher/quizzes/api';
import { QuizListTable } from '@/features/teacher/quizzes/components/QuizListTable';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
} from '@/features/teacher/quizzes/components/QuizShared';
import type { TeacherQuizSummary } from '@/features/teacher/quizzes/types';
import { formatPercentage } from '@/features/teacher/quizzes/utils';

type TeacherCourseQuizzesPageProps = {
  courseId: string;
};

export default function TeacherCourseQuizzesPage({
  courseId,
}: TeacherCourseQuizzesPageProps) {
  const confirm = useConfirm();
  const [courseTitle, setCourseTitle] = useState('Course');
  const [quizzes, setQuizzes] = useState<TeacherQuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [togglingResultsQuizId, setTogglingResultsQuizId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [course, courseQuizzes] = await Promise.all([
        getTeacherCourseById(courseId),
        getTeacherQuizzesByCourse(courseId),
      ]);

      setCourseTitle(course.title);
      setQuizzes(courseQuizzes);
    } catch (loadError) {
      setError(getTeacherQuizErrorMessage(loadError, 'Unable to load course quizzes.'));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const totalSubmissions = quizzes.reduce((total, quiz) => total + quiz.submissionCount, 0);
    const publishedCount = quizzes.filter((quiz) => quiz.isPublished).length;
    const average =
      quizzes.length > 0
        ? quizzes.reduce((total, quiz) => total + quiz.averageScorePercent, 0) / quizzes.length
        : 0;

    return { totalSubmissions, publishedCount, average };
  }, [quizzes]);

  const handleDelete = async (quiz: TeacherQuizSummary) => {
    const approved = await confirm({
      title: 'Delete this quiz?',
      description:
        'This removes the quiz shell and its questions. Existing student attempts may no longer be reviewable.',
      variant: 'danger',
      confirmText: 'Delete Quiz',
      cancelText: 'Cancel',
    });

    if (!approved) return;

    setDeletingQuizId(quiz.id);
    setError(null);

    try {
      await deleteTeacherQuiz(quiz.id);
      await load();
    } catch (deleteError) {
      setError(getTeacherQuizErrorMessage(deleteError, 'Unable to delete the quiz.'));
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleToggleResults = async (quiz: TeacherQuizSummary) => {
    setTogglingResultsQuizId(quiz.id);
    setError(null);

    try {
      if (quiz.areResultsPublished) {
        await unpublishTeacherQuizResults(quiz.id);
      } else {
        await publishTeacherQuizResults(quiz.id);
      }

      await load();
    } catch (toggleError) {
      setError(
        getTeacherQuizErrorMessage(toggleError, 'Unable to update quiz result visibility.'),
      );
    } finally {
      setTogglingResultsQuizId(null);
    }
  };

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Course Quiz List"
        title={courseTitle}
        description="Manage quizzes in this course, update visibility, and open submissions for manual review."
        backHref="/teacher/dashboard/quizzes"
        actions={[
          {
            label: 'Create Quiz',
            href: `/teacher/dashboard/courses/${courseId}/quizzes/new`,
            variant: 'primary',
          },
        ]}
      >
        <BreadcrumbTrail
          items={[
            { label: 'Quiz Workspace', href: '/teacher/dashboard/quizzes' },
            { label: courseTitle },
          ]}
        />
      </QuizPageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <QuizMetricCard label="Quizzes" value={String(quizzes.length)} />
        <QuizMetricCard label="Published" value={String(metrics.publishedCount)} />
        <QuizMetricCard
          label="Average Score"
          value={quizzes.length > 0 ? formatPercentage(metrics.average) : '—'}
          hint={`${metrics.totalSubmissions} submissions recorded`}
        />
      </div>

      <ErrorAlert message={error ?? ''} />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Quiz list</h2>
          <p className="text-sm text-slate-500">
            Each row maps directly to the course-scoped teacher quiz endpoints.
          </p>
        </div>

        <QuizListTable
          courseId={courseId}
          quizzes={quizzes}
          isLoading={isLoading}
          deletingQuizId={deletingQuizId}
          togglingResultsQuizId={togglingResultsQuizId}
          emptyMessage="No quizzes exist for this course yet."
          onDelete={handleDelete}
          onToggleResults={handleToggleResults}
        />
      </section>
    </div>
  );
}
