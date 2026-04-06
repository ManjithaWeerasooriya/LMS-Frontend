'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlarmClock,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  PlayCircle,
  RefreshCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { useConfirm } from '@/context/ConfirmContext';
import {
  getMyStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import { StudentQuizQuestionCard } from '@/features/student/quizzes/components/StudentQuizQuestionCard';
import {
  buildStudentQuizDraftsFromAttempt,
  buildStudentQuizSubmitPayload,
  createEmptyStudentQuizDraft,
  getStudentQuizAttemptDetail,
  getStudentQuizById,
  getStudentQuizErrorMessage,
  hasStudentQuizCompletedAttempt,
  isQuizInProgressStatus,
  isQuizRetakeAvailableStatus,
  isQuizSubmittedStatus,
  isQuizUnavailableStatus,
  startStudentQuizAttempt,
  StudentQuizApiError,
  submitStudentQuizAttempt,
  type StudentQuizAnswerDraft,
  type StudentQuizAttemptDetail,
  type StudentQuizSummary,
} from '@/features/student/quizzes/api';
import { formatStudentQuizAvailability } from '@/features/student/quizzes/utils';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';
import { formatDateTime, formatMarks, formatPercentage } from '@/features/teacher/quizzes/utils';
import { logoutUser } from '@/lib/auth';

type StudentQuizAttemptPageProps = {
  courseId: string;
  quizId: string;
};

type StudentQuizPageState = {
  loading: boolean;
  error: string | null;
  enrolledCourse: StudentCourseListItem | null;
  quiz: StudentQuizSummary | null;
  attempt: StudentQuizAttemptDetail | null;
};

const initialState: StudentQuizPageState = {
  loading: true,
  error: null,
  enrolledCourse: null,
  quiz: null,
  attempt: null,
};

const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const isQuizForCourse = (
  quiz: StudentQuizSummary,
  courseId: string,
  courseTitle?: string | null,
) => {
  if (quiz.courseId && quiz.courseId === courseId) {
    return true;
  }

  if (!quiz.courseTitle || !courseTitle) {
    return !quiz.courseId;
  }

  return normalizeLabel(quiz.courseTitle) === normalizeLabel(courseTitle);
};

const formatAvailabilityWindow = (
  availableFrom: string | null,
  availableUntil: string | null,
  availabilityLabel: string | null,
) =>
  formatStudentQuizAvailability(availableFrom, availableUntil, availabilityLabel, {
    fallbackLabel: 'Availability window not specified',
  });

const formatDuration = (durationMinutes: number | null) =>
  durationMinutes && durationMinutes > 0 ? `${durationMinutes} minutes` : 'Duration not specified';

const formatCountdown = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const isDraftAnswered = (draft: StudentQuizAnswerDraft | undefined) =>
  Boolean(
    draft &&
      (draft.selectedOptionIds.length > 0 ||
        draft.answerText.trim().length > 0 ||
        (draft.fileReference?.trim().length ?? 0) > 0),
  );

const deriveRemainingSeconds = (attempt: StudentQuizAttemptDetail | null): number | null => {
  if (!attempt || isQuizSubmittedStatus(attempt.status)) {
    return null;
  }

  if (attempt.timeRemainingSeconds != null && attempt.timeRemainingSeconds >= 0) {
    return attempt.timeRemainingSeconds;
  }

  if (!attempt.startedAt || !attempt.durationMinutes) {
    return null;
  }

  const startedAt = new Date(attempt.startedAt).getTime();
  if (Number.isNaN(startedAt)) {
    return null;
  }

  const endsAt = startedAt + attempt.durationMinutes * 60_000;
  const remaining = Math.floor((endsAt - Date.now()) / 1000);
  return Math.max(0, remaining);
};

const getOverviewActionLabel = (quiz: StudentQuizSummary | null) => {
  if (!quiz) {
    return 'Start Quiz';
  }

  if (isQuizSubmittedStatus(quiz.status)) {
    return 'Quiz Submitted';
  }

  if (isQuizInProgressStatus(quiz.status)) {
    return 'Continue Quiz';
  }

  if (isQuizRetakeAvailableStatus(quiz.status)) {
    return 'Retake Quiz';
  }

  return 'Start Quiz';
};

const isStudentQuizAttemptLockedMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.includes('multiple attempts are not allowed') ||
    normalized.includes('already submitted') ||
    normalized.includes('already completed') ||
    normalized.includes('already attempted') ||
    normalized.includes('attempt limit')
  );
};

const formatResultScore = (score: number | null, totalMarks: number | null) => {
  if (score == null) {
    return 'Awaiting grading';
  }

  if (totalMarks != null) {
    return `${formatMarks(score)} / ${formatMarks(totalMarks)}`;
  }

  return formatMarks(score);
};

export default function StudentQuizAttemptPage({
  courseId,
  quizId,
}: StudentQuizAttemptPageProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const autoSubmitTriggeredRef = useRef(false);
  const [state, setState] = useState<StudentQuizPageState>(initialState);
  const [drafts, setDrafts] = useState<Record<string, StudentQuizAnswerDraft>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const loadQuizPage = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));
    setSubmissionMessage(null);

    try {
      const enrolledCourses = await getMyStudentCourses();
      const enrolledCourse = enrolledCourses.find((course) => course.id === courseId) ?? null;

      if (!enrolledCourse) {
        setState({
          loading: false,
          error: 'You must be enrolled in this course to access its quizzes.',
          enrolledCourse: null,
          quiz: null,
          attempt: null,
        });
        setDrafts({});
        setRemainingSeconds(null);
        return;
      }

      const quiz = await getStudentQuizById(quizId);

      if (!isQuizForCourse(quiz, courseId, enrolledCourse.title)) {
        setState({
          loading: false,
          error: 'This quiz does not belong to the selected course.',
          enrolledCourse,
          quiz: null,
          attempt: null,
        });
        setDrafts({});
        setRemainingSeconds(null);
        return;
      }

      const resumeAttemptId =
        quiz.activeAttemptId ??
        (quiz.latestAttemptId &&
        (isQuizInProgressStatus(quiz.latestAttemptStatus) || isQuizSubmittedStatus(quiz.latestAttemptStatus))
          ? quiz.latestAttemptId
          : null);

      const attempt = resumeAttemptId
        ? await getStudentQuizAttemptDetail(resumeAttemptId, quizId)
        : null;
      const nextDrafts = attempt ? buildStudentQuizDraftsFromAttempt(attempt) : {};

      autoSubmitTriggeredRef.current = false;
      setState({
        loading: false,
        error: null,
        enrolledCourse,
        quiz,
        attempt,
      });
      setDrafts(nextDrafts);
      setRemainingSeconds(deriveRemainingSeconds(attempt));
    } catch (loadError) {
      if (loadError instanceof StudentApiError && (loadError.status === 401 || loadError.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      if (loadError instanceof StudentQuizApiError && (loadError.status === 401 || loadError.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error:
          loadError instanceof StudentQuizApiError
            ? loadError.message
            : getStudentQuizErrorMessage(loadError, 'Unable to load this quiz.'),
      }));
    }
  }, [courseId, quizId, router]);

  useEffect(() => {
    void loadQuizPage();
  }, [loadQuizPage]);

  useEffect(() => {
    if (!state.attempt) {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(deriveRemainingSeconds(state.attempt));
  }, [state.attempt]);

  useEffect(() => {
    if (remainingSeconds == null || remainingSeconds <= 0 || isQuizSubmittedStatus(state.attempt?.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => (current == null ? current : Math.max(0, current - 1)));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [remainingSeconds, state.attempt?.status]);

  const submitAttempt = useCallback(
    async (reason: 'manual' | 'auto') => {
      if (!state.attempt) {
        return;
      }

      setIsSubmitting(true);
      setState((current) => ({ ...current, error: null }));

      try {
        const payload = buildStudentQuizSubmitPayload(state.attempt.questions, drafts);
        await submitStudentQuizAttempt(state.attempt.id, payload);

        let refreshedAttempt: StudentQuizAttemptDetail | null = null;
        let refreshedQuiz: StudentQuizSummary | null = null;

        try {
          refreshedAttempt = await getStudentQuizAttemptDetail(state.attempt.id, quizId);
        } catch {
          refreshedAttempt = null;
        }

        try {
          refreshedQuiz = await getStudentQuizById(quizId);
        } catch {
          refreshedQuiz = null;
        }

        const submittedAttempt =
          refreshedAttempt ??
          ({
            ...state.attempt,
            status: 'Submitted',
            submittedAt: new Date().toISOString(),
          } as StudentQuizAttemptDetail);
        const submittedAt = submittedAttempt.submittedAt ?? new Date().toISOString();
        const fallbackQuizStatus = state.quiz?.allowMultipleAttempts ? 'Retake Available' : 'Completed';

        setState((current) => ({
          ...current,
          attempt: {
            ...submittedAttempt,
            status: submittedAttempt.status ?? 'Submitted',
            submittedAt,
          },
          quiz: refreshedQuiz
            ? {
                ...refreshedQuiz,
                latestAttemptId: submittedAttempt.id,
                latestAttemptStatus:
                  refreshedQuiz.latestAttemptStatus ?? refreshedQuiz.status ?? 'Completed',
                submittedAt: refreshedQuiz.submittedAt ?? submittedAt,
                activeAttemptId: null,
              }
            : current.quiz
            ? {
                ...current.quiz,
                status: fallbackQuizStatus,
                attemptCount: Math.max(1, current.quiz.attemptCount),
                latestAttemptId: submittedAttempt.id,
                latestAttemptStatus: fallbackQuizStatus,
                submittedAt,
                activeAttemptId: null,
              }
            : current.quiz,
        }));
        setRemainingSeconds(null);
        setSubmissionMessage(
          reason === 'auto'
            ? 'Time expired. Your quiz was submitted automatically.'
            : 'Quiz submitted successfully.',
        );
      } catch (submitError) {
        setState((current) => ({
          ...current,
          error:
            submitError instanceof StudentQuizApiError
              ? submitError.message
              : getStudentQuizErrorMessage(submitError, 'Unable to submit this quiz.'),
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [drafts, quizId, state.attempt, state.quiz?.allowMultipleAttempts],
  );

  useEffect(() => {
    if (
      remainingSeconds !== 0 ||
      !state.attempt ||
      isSubmitting ||
      isQuizSubmittedStatus(state.attempt.status) ||
      autoSubmitTriggeredRef.current
    ) {
      return;
    }

    autoSubmitTriggeredRef.current = true;
    void submitAttempt('auto');
  }, [isSubmitting, remainingSeconds, state.attempt, submitAttempt]);

  const handleStart = async () => {
    setIsStarting(true);
    setState((current) => ({ ...current, error: null }));
    setSubmissionMessage(null);

    try {
      const attempt = await startStudentQuizAttempt(quizId);
      const nextDrafts = buildStudentQuizDraftsFromAttempt(attempt);

      autoSubmitTriggeredRef.current = false;
      setState((current) => ({
        ...current,
        attempt,
        quiz: current.quiz
          ? {
              ...current.quiz,
              status: attempt.status,
              attemptCount: Math.max(1, current.quiz.attemptCount),
              activeAttemptId: isQuizSubmittedStatus(attempt.status) ? null : attempt.id,
              latestAttemptId: attempt.id,
              latestAttemptStatus: attempt.status,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt,
              timeRemainingSeconds: attempt.timeRemainingSeconds,
            }
          : current.quiz,
      }));
      setDrafts(nextDrafts);
      setRemainingSeconds(deriveRemainingSeconds(attempt));
    } catch (startError) {
      const message =
        startError instanceof StudentQuizApiError
          ? startError.message
          : getStudentQuizErrorMessage(startError, 'Unable to start this quiz.');

      if (isStudentQuizAttemptLockedMessage(message)) {
        let recoveredQuiz: StudentQuizSummary | null = null;
        let recoveredAttempt: StudentQuizAttemptDetail | null = null;

        try {
          recoveredQuiz = await getStudentQuizById(quizId);
          const recoveredAttemptId =
            recoveredQuiz.activeAttemptId ?? recoveredQuiz.latestAttemptId;

          if (recoveredAttemptId) {
            recoveredAttempt = await getStudentQuizAttemptDetail(recoveredAttemptId, quizId);
          }
        } catch {
          recoveredQuiz = null;
          recoveredAttempt = null;
        }

        if (recoveredAttempt) {
          const nextDrafts = buildStudentQuizDraftsFromAttempt(recoveredAttempt);
          const recoveredStatus = recoveredAttempt.status ?? 'In Progress';

          autoSubmitTriggeredRef.current = false;
          setState((current) => ({
            ...current,
            error: null,
            attempt: recoveredAttempt,
            quiz: recoveredQuiz
              ? {
                  ...recoveredQuiz,
                  status: recoveredStatus,
                  latestAttemptId: recoveredAttempt.id || recoveredQuiz.latestAttemptId,
                  latestAttemptStatus: recoveredStatus,
                  activeAttemptId: isQuizSubmittedStatus(recoveredStatus)
                    ? null
                    : recoveredAttempt.id || recoveredQuiz.activeAttemptId,
                  startedAt: recoveredAttempt.startedAt ?? recoveredQuiz.startedAt,
                  submittedAt: recoveredAttempt.submittedAt ?? recoveredQuiz.submittedAt,
                  timeRemainingSeconds:
                    recoveredAttempt.timeRemainingSeconds ?? recoveredQuiz.timeRemainingSeconds,
                }
              : current.quiz
                ? {
                    ...current.quiz,
                    status: recoveredStatus,
                    attemptCount: Math.max(1, current.quiz.attemptCount),
                    latestAttemptId: recoveredAttempt.id,
                    latestAttemptStatus: recoveredStatus,
                    activeAttemptId: isQuizSubmittedStatus(recoveredStatus)
                      ? null
                      : recoveredAttempt.id,
                    startedAt: recoveredAttempt.startedAt,
                    submittedAt: recoveredAttempt.submittedAt,
                    timeRemainingSeconds: recoveredAttempt.timeRemainingSeconds,
                  }
                : current.quiz,
          }));
          setDrafts(nextDrafts);
          setRemainingSeconds(deriveRemainingSeconds(recoveredAttempt));
          setSubmissionMessage(
            isQuizSubmittedStatus(recoveredStatus)
              ? 'This quiz has already been submitted. Additional attempts are not allowed.'
              : null,
          );
          return;
        }

        const lockedStatus = 'Completed';
        const submittedAt =
          recoveredQuiz?.submittedAt ?? state.quiz?.submittedAt ?? new Date().toISOString();

        setState((current) => ({
          ...current,
          error: null,
          attempt: null,
          quiz: recoveredQuiz
            ? {
                ...recoveredQuiz,
                status: lockedStatus,
                latestAttemptStatus:
                  recoveredQuiz.latestAttemptStatus ?? lockedStatus,
                activeAttemptId: null,
                submittedAt,
              }
            : current.quiz
              ? {
                  ...current.quiz,
                  status: lockedStatus,
                  attemptCount: Math.max(1, current.quiz.attemptCount),
                  latestAttemptStatus: lockedStatus,
                  activeAttemptId: null,
                  submittedAt,
                }
              : current.quiz,
        }));
        setDrafts({});
        setRemainingSeconds(null);
        setSubmissionMessage(
          'This quiz has already been submitted. Additional attempts are not allowed.',
        );
        return;
      }

      setState((current) => ({
        ...current,
        error:
          startError instanceof StudentQuizApiError
            ? startError.message
            : message,
      }));
    } finally {
      setIsStarting(false);
    }
  };

  const handleManualSubmit = async () => {
    const approved = await confirm({
      title: 'Submit this quiz?',
      description: 'You will not be able to change your answers after final submission.',
      confirmText: 'Submit Quiz',
      cancelText: 'Keep Editing',
      variant: 'warning',
    });

    if (!approved) {
      return;
    }

    await submitAttempt('manual');
  };

  const handleDraftChange = (questionId: string, nextValue: StudentQuizAnswerDraft) => {
    setDrafts((current) => ({
      ...current,
      [questionId]: nextValue,
    }));
  };

  const attempt = state.attempt;
  const quiz = state.quiz;
  const course = state.enrolledCourse;
  const resultSource = attempt ?? quiz;
  const readOnly = hasStudentQuizCompletedAttempt(resultSource);
  const activeQuestions = useMemo(() => attempt?.questions ?? [], [attempt?.questions]);
  const answeredCount = useMemo(
    () => activeQuestions.filter((question) => isDraftAnswered(drafts[question.id])).length,
    [activeQuestions, drafts],
  );
  const unavailable = quiz && isQuizUnavailableStatus(quiz.status) && !attempt;
  const startActionDisabled = unavailable || isQuizSubmittedStatus(quiz?.status);
  const areResultsPublished = resultSource?.areResultsPublished === true;
  const resultScore = attempt?.score ?? quiz?.score ?? null;
  const resultPercentage = attempt?.percentage ?? quiz?.percentage ?? null;
  const resultTotalMarks = attempt?.totalMarks ?? quiz?.totalMarks ?? null;
  const resultSubmittedAt = attempt?.submittedAt ?? quiz?.submittedAt ?? null;
  const resultsAwaitingGrading =
    areResultsPublished &&
    resultScore == null &&
    ((attempt?.requiresManualGrading ?? quiz?.requiresManualGrading) === true ||
      (attempt?.answersPendingGrading ?? quiz?.answersPendingGrading ?? 0) > 0);

  if (state.loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-8 w-72 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`student-quiz-skeleton-${index + 1}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-7 w-14 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Student Quiz"
        title={quiz?.title ?? 'Quiz'}
        description={
          quiz?.description ??
          (readOnly
            ? 'Review your submitted quiz status and any published results.'
            : 'Review the quiz instructions, start or continue your attempt, and submit once you finish answering.')
        }
        backHref={`/student/dashboard/courses/${courseId}`}
        actions={[
          {
            label: 'Back to Course',
            href: `/student/dashboard/courses/${courseId}`,
            variant: 'secondary',
          },
        ]}
      >
        <BreadcrumbTrail
          items={[
            { label: 'My Courses', href: '/student/dashboard/courses' },
            { label: course?.title ?? 'Course', href: `/student/dashboard/courses/${courseId}` },
            { label: quiz?.title ?? 'Quiz' },
          ]}
        />
      </QuizPageHeader>

      <ErrorAlert message={state.error ?? ''} />

      {submissionMessage ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{submissionMessage}</p>
              <p className="mt-1">
                Your latest quiz state has been locked. You can return to the course page at any
                time.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!course ? (
        <QuizStatePanel
          title="Course access required"
          message="You must be enrolled in the related course before opening this quiz."
          tone="error"
          action={
            <Link
              href="/student/dashboard/courses"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17306f]"
            >
              Go to My Courses
            </Link>
          }
        />
      ) : null}

      {quiz ? (
        <div className="grid gap-4 md:grid-cols-3">
          <QuizMetricCard label="Status" value={quiz.status ?? 'Unknown'} />
          <QuizMetricCard label="Duration" value={formatDuration(quiz.durationMinutes)} />
          <QuizMetricCard
            label="Availability"
            value={formatAvailabilityWindow(
              quiz.availableFrom,
              quiz.availableUntil,
              quiz.availabilityLabel,
            )}
          />
        </div>
      ) : null}

      {readOnly ? (
        <QuizSectionCard
          title="Quiz results"
          description="This quiz has already been attempted. Result visibility depends on whether your instructor has published the results."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <QuizMetricCard label="Attempt Status" value="Attempted" />
            <QuizMetricCard
              label="Result State"
              value={areResultsPublished ? 'Published' : 'Not published'}
            />
            <QuizMetricCard
              label="Score"
              value={
                areResultsPublished
                  ? formatResultScore(resultScore, resultTotalMarks)
                  : 'Hidden until published'
              }
              hint={areResultsPublished && resultPercentage != null ? formatPercentage(resultPercentage) : undefined}
            />
            <QuizMetricCard
              label="Submitted"
              value={resultSubmittedAt ? formatDateTime(resultSubmittedAt) : 'Attempt recorded'}
            />
          </div>

          <div
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              areResultsPublished
                ? resultsAwaitingGrading
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {areResultsPublished
              ? resultsAwaitingGrading
                ? 'Results are published, but grading is still in progress.'
                : resultScore == null
                  ? 'Results are published. Score details are not available yet.'
                  : 'Results are published and available for review.'
              : 'Results are not published yet.'}
          </div>
        </QuizSectionCard>
      ) : null}

      {quiz && !attempt && !readOnly ? (
        <QuizSectionCard
          title="Quiz overview"
          description="Start the quiz when you are ready. If an attempt already exists, this action resumes it."
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Instructions
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {quiz.instructions ??
                    'Read each question carefully before answering. Answers are submitted together at the end of the quiz.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Questions
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {quiz.questionCount ?? 'TBA'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Marks
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {quiz.totalMarks ?? 'TBA'}
                  </p>
                </div>
              </div>

              {unavailable ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  This quiz is not currently available. Check the availability window above or
                  contact your instructor.
                </div>
              ) : null}
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <ClipboardList className="h-4 w-4" />
                Ready to begin
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Attempt setup</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Starting the quiz creates or resumes your backend attempt. Answers will remain in
                this page until you submit them.
              </p>

              <button
                type="button"
                disabled={isStarting || isSubmitting || startActionDisabled}
                onClick={() => void handleStart()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {isStarting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                {isStarting ? 'Opening quiz…' : getOverviewActionLabel(quiz)}
              </button>
            </aside>
          </div>
        </QuizSectionCard>
      ) : null}

      {quiz && !attempt && readOnly ? (
        <QuizStatePanel
          title="Attempt recorded"
          message="This quiz has already been submitted. The backend did not return question-by-question review data for this attempt, but your result status is shown above."
          tone="neutral"
        />
      ) : null}

      {attempt ? (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <QuizMetricCard label="Attempt Status" value={attempt.status ?? 'Unknown'} />
            <QuizMetricCard
              label="Started"
              value={attempt.startedAt ? formatDateTime(attempt.startedAt) : 'Not started'}
            />
            <QuizMetricCard
              label="Answered"
              value={`${answeredCount}/${attempt.questions.length || attempt.questionCount || 0}`}
            />
            <QuizMetricCard
              label={readOnly ? 'Submitted' : 'Time Left'}
              value={
                readOnly
                  ? attempt.submittedAt
                    ? formatDateTime(attempt.submittedAt)
                    : 'Submitted'
                  : remainingSeconds != null
                    ? formatCountdown(remainingSeconds)
                    : 'No timer'
              }
              hint={
                !readOnly && remainingSeconds != null
                  ? 'Timer updates from your current attempt state.'
                  : undefined
              }
            />
          </div>

          {!readOnly && remainingSeconds != null ? (
            <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <AlarmClock className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Countdown active</p>
                  <p className="mt-1">
                    Remaining time: {formatCountdown(remainingSeconds)}. The quiz will auto-submit
                    if the timer reaches zero.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {attempt.questions.length === 0 ? (
            <QuizStatePanel
              title={readOnly ? 'Quiz submitted' : 'No questions available'}
              message={
                readOnly
                  ? 'This attempt is already closed. Question data was not returned by the backend for review.'
                  : 'The attempt was created, but no questions were returned by the backend.'
              }
              tone={readOnly ? 'neutral' : 'error'}
              action={
                !readOnly ? (
                  <button
                    type="button"
                    onClick={() => void loadQuizPage()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reload Quiz
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <QuizSectionCard
                title="Question navigation"
                description={
                  readOnly
                    ? 'Jump between questions to review the submitted attempt.'
                    : 'Jump between questions while your current answers stay in local component state.'
                }
              >
                <div className="flex flex-wrap gap-2">
                  {attempt.questions.map((question, index) => {
                    const answered = isDraftAnswered(drafts[question.id]);

                    return (
                      <a
                        key={question.id}
                        href={`#question-${question.id}`}
                        className={`inline-flex min-w-11 items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                          answered
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {index + 1}
                      </a>
                    );
                  })}
                </div>
              </QuizSectionCard>

              <div className="space-y-4">
                {attempt.questions.map((question, index) => (
                  <StudentQuizQuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={index + 1}
                    value={drafts[question.id] ?? createEmptyStudentQuizDraft(question.id)}
                    readOnly={readOnly}
                    onChange={(nextValue) => handleDraftChange(question.id, nextValue)}
                  />
                ))}
              </div>

              {!readOnly ? (
                <div className="sticky bottom-4 z-10 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {answeredCount} of {attempt.questions.length} questions answered
                      </p>
                      <p className="text-sm text-slate-500">
                        Answers are kept in this page until final submission.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleManualSubmit()}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B3B8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock3 className="h-4 w-4" />
                      )}
                      {isSubmitting ? 'Submitting…' : 'Submit Quiz'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {readOnly ? (
        <div className="flex justify-start">
          <Link
            href={`/student/dashboard/courses/${courseId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Course
          </Link>
        </div>
      ) : null}
    </div>
  );
}
