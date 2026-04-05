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
  isQuizInProgressStatus,
  isQuizSubmittedStatus,
  isQuizUnavailableStatus,
  startStudentQuizAttempt,
  StudentQuizApiError,
  submitStudentQuizAttempt,
  type StudentQuizAnswerDraft,
  type StudentQuizAttemptDetail,
  type StudentQuizSummary,
} from '@/features/student/quizzes/api';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';
import { formatDateTime } from '@/features/teacher/quizzes/utils';
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

const getAttemptStorageKey = (attemptKey: string) => `student-quiz-draft:${attemptKey}`;

const readStoredDrafts = (
  attemptKey: string,
): Record<string, StudentQuizAnswerDraft> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getAttemptStorageKey(attemptKey));
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, StudentQuizAnswerDraft>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredDrafts = (
  attemptKey: string,
  drafts: Record<string, StudentQuizAnswerDraft>,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getAttemptStorageKey(attemptKey), JSON.stringify(drafts));
};

const clearStoredDrafts = (attemptKey: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getAttemptStorageKey(attemptKey));
};

const formatAvailabilityWindow = (
  availableFrom: string | null,
  availableUntil: string | null,
  availabilityLabel: string | null,
) => {
  if (availabilityLabel) {
    return availabilityLabel;
  }

  if (availableFrom && availableUntil) {
    return `${formatDateTime(availableFrom)} to ${formatDateTime(availableUntil)}`;
  }

  if (availableFrom) {
    return `Opens ${formatDateTime(availableFrom)}`;
  }

  if (availableUntil) {
    return `Closes ${formatDateTime(availableUntil)}`;
  }

  return 'Availability window not specified';
};

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

const mergeDrafts = (
  baseDrafts: Record<string, StudentQuizAnswerDraft>,
  storedDrafts: Record<string, StudentQuizAnswerDraft>,
) =>
  Object.entries(baseDrafts).reduce<Record<string, StudentQuizAnswerDraft>>((accumulator, [questionId, draft]) => {
    const storedDraft = storedDrafts[questionId];
    accumulator[questionId] = storedDraft
      ? {
          ...draft,
          ...storedDraft,
          questionId,
          selectedOptionIds: Array.isArray(storedDraft.selectedOptionIds)
            ? storedDraft.selectedOptionIds
            : draft.selectedOptionIds,
        }
      : draft;
    return accumulator;
  }, {});

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

  return 'Start Quiz';
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
      const attemptStorageKey = attempt ? attempt.id || attempt.quizId || quizId : null;

      const nextDrafts = attempt
        ? mergeDrafts(
            buildStudentQuizDraftsFromAttempt(attempt),
            readStoredDrafts(attemptStorageKey ?? quizId),
          )
        : {};

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
    if (!state.attempt || isQuizSubmittedStatus(state.attempt.status)) {
      return;
    }

    writeStoredDrafts(state.attempt.id || state.attempt.quizId || quizId, drafts);
  }, [drafts, quizId, state.attempt]);

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
        clearStoredDrafts(state.attempt.id || state.attempt.quizId || quizId);

        let refreshedAttempt: StudentQuizAttemptDetail | null = null;

        try {
          refreshedAttempt = await getStudentQuizAttemptDetail(state.attempt.id, quizId);
        } catch {
          refreshedAttempt = null;
        }

        const submittedAttempt =
          refreshedAttempt ??
          ({
            ...state.attempt,
            status: 'Submitted',
            submittedAt: new Date().toISOString(),
          } as StudentQuizAttemptDetail);

        setState((current) => ({
          ...current,
          attempt: submittedAttempt,
          quiz: current.quiz
            ? {
                ...current.quiz,
                status: submittedAttempt.status,
                latestAttemptId: submittedAttempt.id,
                latestAttemptStatus: submittedAttempt.status,
                submittedAt: submittedAttempt.submittedAt,
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
    [drafts, quizId, state.attempt],
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
      const nextDrafts = mergeDrafts(
        buildStudentQuizDraftsFromAttempt(attempt),
        readStoredDrafts(attempt.id || attempt.quizId || quizId),
      );

      autoSubmitTriggeredRef.current = false;
      setState((current) => ({
        ...current,
        attempt,
        quiz: current.quiz
          ? {
              ...current.quiz,
              status: attempt.status,
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
      setState((current) => ({
        ...current,
        error:
          startError instanceof StudentQuizApiError
            ? startError.message
            : getStudentQuizErrorMessage(startError, 'Unable to start this quiz.'),
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
  const readOnly = isQuizSubmittedStatus(attempt?.status ?? quiz?.status);
  const activeQuestions = useMemo(() => attempt?.questions ?? [], [attempt?.questions]);
  const answeredCount = useMemo(
    () => activeQuestions.filter((question) => isDraftAnswered(drafts[question.id])).length,
    [activeQuestions, drafts],
  );
  const unavailable = quiz && isQuizUnavailableStatus(quiz.status) && !attempt;
  const startActionDisabled = unavailable || isQuizSubmittedStatus(quiz?.status);

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
          'Review the quiz instructions, start or continue your attempt, and submit once you finish answering.'
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

      {quiz && !attempt ? (
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

              {isQuizSubmittedStatus(quiz.status) ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  This quiz has already been submitted. If the backend exposes a submitted attempt
                  later, this page will show it in read-only mode.
                </div>
              ) : null}

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
                description="Jump between questions while your current answers stay in local component state."
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
