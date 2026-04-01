'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ErrorAlert } from '@/components/ErrorAlert';
import { useConfirm } from '@/context/ConfirmContext';
import { getTeacherCourseById } from '@/features/teacher/api/teacher';
import type {
  CreateQuestionDto,
  CreateQuizDto,
  UpdateQuestionDto,
  UpdateQuizDto,
} from '@/generated/api-types';
import {
  createTeacherQuiz,
  createTeacherQuizQuestion,
  deleteTeacherQuizQuestion,
  getTeacherQuizById,
  getTeacherQuizErrorMessage,
  getTeacherQuizQuestions,
  getTeacherQuizzesByCourse,
  publishTeacherQuizResults,
  unpublishTeacherQuizResults,
  updateTeacherQuiz,
  updateTeacherQuizQuestion,
} from '@/features/teacher/quizzes/api';
import { QuizDetailsForm } from '@/features/teacher/quizzes/components/QuizDetailsForm';
import { QuizQuestionsManager } from '@/features/teacher/quizzes/components/QuizQuestionsManager';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
  QuizStatusBadge,
} from '@/features/teacher/quizzes/components/QuizShared';
import type {
  QuestionEditorValues,
  QuizEditorValues,
  TeacherQuizDetail,
  TeacherQuizQuestion,
} from '@/features/teacher/quizzes/types';
import {
  formatDateTime,
  formatMarks,
  toDateTimeLocalInput,
  toUtcIsoString,
} from '@/features/teacher/quizzes/utils';

type TeacherQuizEditorPageProps = {
  courseId: string;
  quizId?: string;
  mode: 'create' | 'edit';
};

const buildQuizPayload = (values: QuizEditorValues): CreateQuizDto | UpdateQuizDto => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  durationMinutes: values.durationMinutes,
  totalMarks: values.totalMarks,
  startTimeUtc: toUtcIsoString(values.startTimeLocal),
  endTimeUtc: toUtcIsoString(values.endTimeLocal),
  randomizeQuestions: values.randomizeQuestions,
  allowMultipleAttempts: values.allowMultipleAttempts,
  isPublished: values.isPublished,
  areResultsPublished: values.areResultsPublished,
});

const mapQuizToForm = (quiz: TeacherQuizDetail): QuizEditorValues => ({
  title: quiz.title,
  description: quiz.description,
  durationMinutes: quiz.durationMinutes || 30,
  totalMarks: quiz.totalMarks || 100,
  startTimeLocal: toDateTimeLocalInput(quiz.startTimeUtc),
  endTimeLocal: toDateTimeLocalInput(quiz.endTimeUtc),
  randomizeQuestions: quiz.randomizeQuestions,
  allowMultipleAttempts: quiz.allowMultipleAttempts,
  isPublished: quiz.isPublished,
  areResultsPublished: quiz.areResultsPublished,
});

const buildQuestionPayload = (
  value: QuestionEditorValues,
): CreateQuestionDto | UpdateQuestionDto => ({
  text: value.text.trim(),
  type: value.type,
  marks: value.marks,
  orderIndex: value.orderIndex,
  options:
    value.options.length > 0
      ? value.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          orderIndex: option.orderIndex,
        }))
      : null,
});

export default function TeacherQuizEditorPage({
  courseId,
  quizId,
  mode,
}: TeacherQuizEditorPageProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [courseTitle, setCourseTitle] = useState('Course');
  const [quiz, setQuiz] = useState<TeacherQuizDetail | null>(null);
  const [questions, setQuestions] = useState<TeacherQuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isTogglingResults, setIsTogglingResults] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const loadEditData = useCallback(async () => {
    if (!quizId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [course, quizDetail, quizQuestions] = await Promise.all([
        getTeacherCourseById(courseId),
        getTeacherQuizById(quizId),
        getTeacherQuizQuestions(quizId),
      ]);

      setCourseTitle(course.title);
      setQuiz(quizDetail);
      setQuestions(quizQuestions);
    } catch (loadError) {
      setError(getTeacherQuizErrorMessage(loadError, 'Unable to load the quiz editor.'));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, quizId]);

  const loadCourseTitle = useCallback(async () => {
    try {
      const course = await getTeacherCourseById(courseId);
      setCourseTitle(course.title);
    } catch (loadError) {
      setError(getTeacherQuizErrorMessage(loadError, 'Unable to load the course.'));
    }
  }, [courseId]);

  useEffect(() => {
    if (mode === 'create') {
      void loadCourseTitle();
      return;
    }

    void loadEditData();
  }, [loadCourseTitle, loadEditData, mode]);

  const metrics = useMemo(() => {
    const totalQuestionMarks = questions.reduce((total, question) => total + question.marks, 0);

    return {
      questionCount: questions.length,
      totalQuestionMarks,
      submissionCount: quiz?.submissionCount ?? 0,
    };
  }, [questions, quiz]);

  const handleQuizSubmit = async (values: QuizEditorValues) => {
    setIsSavingQuiz(true);
    setError(null);

    try {
      const payload = buildQuizPayload(values);

      if (mode === 'create') {
        const createdQuizId = await createTeacherQuiz({
          ...(payload as CreateQuizDto),
          courseId,
        });

        let resolvedQuizId = createdQuizId;
        if (!resolvedQuizId) {
          const refreshedQuizzes = await getTeacherQuizzesByCourse(courseId);
          const titleMatch = refreshedQuizzes
            .filter((item) => item.title.toLowerCase() === values.title.trim().toLowerCase())
            .sort((left, right) => {
              const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
              const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
              return rightTime - leftTime;
            })[0];
          resolvedQuizId = titleMatch?.id ?? null;
        }

        if (resolvedQuizId) {
          router.push(`/teacher/dashboard/courses/${courseId}/quizzes/${resolvedQuizId}/edit`);
        } else {
          router.push(`/teacher/dashboard/courses/${courseId}/quizzes`);
        }
        return;
      }

      await updateTeacherQuiz(quizId!, payload as UpdateQuizDto);
      await loadEditData();
    } catch (submitError) {
      setError(getTeacherQuizErrorMessage(submitError, 'Unable to save quiz changes.'));
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleToggleResults = async () => {
    if (!quizId || !quiz) return;

    setIsTogglingResults(true);
    setError(null);

    try {
      if (quiz.areResultsPublished) {
        await unpublishTeacherQuizResults(quizId);
      } else {
        await publishTeacherQuizResults(quizId);
      }

      await loadEditData();
    } catch (toggleError) {
      setError(
        getTeacherQuizErrorMessage(toggleError, 'Unable to update result publishing state.'),
      );
    } finally {
      setIsTogglingResults(false);
    }
  };

  const handleAddQuestion = async (value: QuestionEditorValues) => {
    if (!quizId) return;

    setIsAddingQuestion(true);
    setError(null);

    try {
      await createTeacherQuizQuestion(quizId, buildQuestionPayload(value) as CreateQuestionDto);
      const refreshedQuestions = await getTeacherQuizQuestions(quizId);
      setQuestions(refreshedQuestions);
    } catch (questionError) {
      setError(getTeacherQuizErrorMessage(questionError, 'Unable to add the question.'));
      throw questionError;
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleUpdateQuestion = async (questionId: string, value: QuestionEditorValues) => {
    if (!quizId) return;

    setSavingQuestionId(questionId);
    setError(null);

    try {
      await updateTeacherQuizQuestion(
        quizId,
        questionId,
        buildQuestionPayload(value) as UpdateQuestionDto,
      );
      const refreshedQuestions = await getTeacherQuizQuestions(quizId);
      setQuestions(refreshedQuestions);
    } catch (questionError) {
      setError(getTeacherQuizErrorMessage(questionError, 'Unable to update the question.'));
      throw questionError;
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleDeleteQuestion = async (question: TeacherQuizQuestion) => {
    if (!quizId) return;

    const approved = await confirm({
      title: 'Delete this question?',
      description:
        'This removes the question from the quiz immediately. Existing student submissions may lose grading context.',
      variant: 'danger',
      confirmText: 'Delete Question',
      cancelText: 'Cancel',
    });

    if (!approved) return;

    setDeletingQuestionId(question.id);
    setError(null);

    try {
      await deleteTeacherQuizQuestion(quizId, question.id);
      const refreshedQuestions = await getTeacherQuizQuestions(quizId);
      setQuestions(refreshedQuestions);
    } catch (questionError) {
      setError(getTeacherQuizErrorMessage(questionError, 'Unable to delete the question.'));
    } finally {
      setDeletingQuestionId(null);
    }
  };

  if (mode === 'edit' && isLoading) {
    return (
      <QuizStatePanel
        title="Loading quiz editor"
        message="Fetching the quiz settings and question bank."
      />
    );
  }

  if (mode === 'edit' && (!quizId || !quiz)) {
    return (
      <QuizStatePanel
        tone="error"
        title="Quiz not available"
        message="This quiz could not be loaded. Return to the course quiz list and try again."
      />
    );
  }

  const pageTitle = mode === 'create' ? `Create Quiz for ${courseTitle}` : quiz!.title;
  const breadcrumbItems = [
    { label: 'Quiz Workspace', href: '/teacher/dashboard/quizzes' },
    { label: courseTitle, href: `/teacher/dashboard/courses/${courseId}/quizzes` },
    { label: mode === 'create' ? 'Create quiz' : quiz!.title },
  ];

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow={mode === 'create' ? 'Create Quiz' : 'Quiz Editor'}
        title={pageTitle}
        description={
          mode === 'create'
            ? 'Save the quiz shell first, then continue to question authoring in the editor.'
            : 'Update quiz settings, manage question items, and control when results are visible.'
        }
        backHref={`/teacher/dashboard/courses/${courseId}/quizzes`}
        actions={
          mode === 'edit'
            ? [
                {
                  label: quiz!.areResultsPublished ? 'Unpublish Results' : 'Publish Results',
                  onClick: handleToggleResults,
                  variant: 'secondary',
                  disabled: isTogglingResults,
                },
                {
                  label: 'Review Submissions',
                  href: `/teacher/dashboard/courses/${courseId}/quizzes/${quizId}/submissions`,
                  variant: 'primary',
                },
              ]
            : undefined
        }
      >
        <BreadcrumbTrail items={breadcrumbItems} />
      </QuizPageHeader>

      {mode === 'edit' ? (
        <div className="grid gap-4 md:grid-cols-4">
          <QuizMetricCard label="Questions" value={String(metrics.questionCount)} />
          <QuizMetricCard
            label="Question Marks"
            value={formatMarks(metrics.totalQuestionMarks)}
            hint="Sum of the current question bank"
          />
          <QuizMetricCard
            label="Submissions"
            value={String(metrics.submissionCount)}
            hint="Attempts recorded so far"
          />
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Visibility
            </p>
            <div className="mt-3">
              <QuizStatusBadge
                isPublished={quiz!.isPublished}
                areResultsPublished={quiz!.areResultsPublished}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Window: {formatDateTime(quiz!.startTimeUtc)} to {formatDateTime(quiz!.endTimeUtc)}
            </p>
          </div>
        </div>
      ) : null}

      <ErrorAlert message={error ?? ''} />

      <QuizDetailsForm
        mode={mode}
        initialValues={mode === 'edit' && quiz ? mapQuizToForm(quiz) : undefined}
        isSubmitting={isSavingQuiz}
        error={null}
        onSubmit={handleQuizSubmit}
      />

      {mode === 'edit' ? (
        <QuizSectionCard
          title="Question authoring"
          description="All supported teacher question types can be managed from here."
        >
          <QuizQuestionsManager
            questions={questions}
            isAdding={isAddingQuestion}
            savingQuestionId={savingQuestionId}
            deletingQuestionId={deletingQuestionId}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </QuizSectionCard>
      ) : null}
    </div>
  );
}
