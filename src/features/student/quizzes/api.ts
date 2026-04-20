'use client';

import { isAxiosError } from 'axios';

import { apiClient } from '@/lib/http';
import { normalizeUtcDateTimeString } from '@/lib/datetime';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import type { QuestionType, SubmitQuizAttemptDto } from '@/generated/api-types';
import { QUIZ_QUESTION_TYPES } from '@/features/teacher/quizzes/types';
import { slugifyFallback } from '@/features/teacher/quizzes/utils';
import { getStudentQuizDisplayStatus } from '@/features/student/quizzes/utils';

export type StudentQuizSummary = {
  id: string;
  courseId: string | null;
  courseTitle: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number | null;
  totalMarks: number | null;
  questionCount: number | null;
  status: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  availabilityLabel: string | null;
  isPublished: boolean | null;
  areResultsPublished: boolean | null;
  isAvailable: boolean | null;
  allowMultipleAttempts: boolean | null;
  score: number | null;
  percentage: number | null;
  answersPendingGrading: number | null;
  requiresManualGrading: boolean | null;
  attemptCount: number;
  activeAttemptId: string | null;
  latestAttemptId: string | null;
  latestAttemptStatus: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  timeRemainingSeconds: number | null;
  weekLabel: string | null;
  weekNumber: number | null;
  moduleTitle: string | null;
  lessonTitle: string | null;
  sortOrder: number | null;
};

export type StudentQuizQuestionOption = {
  id: string;
  text: string;
  orderIndex: number;
};

export type StudentQuizQuestion = {
  id: string;
  text: string;
  description: string | null;
  type: QuestionType;
  marks: number | null;
  orderIndex: number;
  options: StudentQuizQuestionOption[];
  unsupported: boolean;
};

export type StudentQuizAttemptAnswer = {
  id: string;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  answerText: string;
  selectedOptionIds: string[];
  fileReference: string | null;
  awardedMarks: number | null;
  maxMarks: number | null;
  teacherFeedback: string | null;
  needsManualGrading: boolean | null;
};

export type StudentQuizAttemptDetail = {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId: string | null;
  courseTitle: string | null;
  description: string | null;
  instructions: string | null;
  durationMinutes: number | null;
  totalMarks: number | null;
  questionCount: number | null;
  status: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  availabilityLabel: string | null;
  isPublished: boolean | null;
  areResultsPublished: boolean | null;
  isAvailable: boolean | null;
  allowMultipleAttempts: boolean | null;
  score: number | null;
  percentage: number | null;
  answersPendingGrading: number | null;
  requiresManualGrading: boolean | null;
  startedAt: string | null;
  submittedAt: string | null;
  timeRemainingSeconds: number | null;
  questions: StudentQuizQuestion[];
  answers: StudentQuizAttemptAnswer[];
};

export type StudentQuizAnswerDraft = {
  questionId: string;
  selectedOptionIds: string[];
  answerText: string;
  fileReference: string | null;
};

export class StudentQuizApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StudentQuizApiError';
    this.status = status;
  }
}

const STUDENT_QUIZZES_PATH = resolveApiPath('/api/v1/student/quizzes');
const STUDENT_QUIZ_DETAIL_PATH = resolveApiPath('/api/v1/student/quizzes/{quizId}');
const STUDENT_QUIZ_START_PATH = resolveApiPath('/api/v1/student/quizzes/{quizId}/attempts');
const STUDENT_QUIZ_RESULT_PATH = resolveApiPath('/api/v1/student/quizzes/{quizId}/result');
const STUDENT_QUIZ_ATTEMPT_PATH = resolveApiPath('/api/v1/student/quizzes/attempts/{attemptId}');
const STUDENT_QUIZ_SUBMIT_PATH = resolveApiPath('/api/v1/student/quizzes/attempts/{attemptId}/submit');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const readBoolean = (record: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }

  return null;
};

const hasDefinedValue = (record: Record<string, unknown>, keys: string[]): boolean =>
  keys.some((key) => key in record && record[key] !== null && record[key] !== undefined);

const roundScore = (value: number) => Math.round(value * 100) / 100;

const readRecord = (
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null => {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
};

const readArray = (record: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const readStringArray = (record: Record<string, unknown>, keys: string[]): string[] =>
  readArray(record, keys)
    .map((value) => (typeof value === 'string' ? value.trim() : null))
    .filter((value): value is string => Boolean(value));

const unwrapCollection = (value: unknown, keys: string[] = []): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of [...keys, 'items', 'results', 'data']) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
};

const unwrapEntity = (value: unknown, keys: string[] = []): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  for (const key of [...keys, 'item', 'data', 'result']) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return value;
};

const normalizeQuestionType = (value: unknown): QuestionType => {
  if (typeof value === 'number' && value >= 1 && value <= 6) {
    return value as QuestionType;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 6) {
      return parsed as QuestionType;
    }
  }

  return QUIZ_QUESTION_TYPES.singleMcq;
};

const normalizeOption = (
  value: unknown,
  index: number,
): StudentQuizQuestionOption => {
  const record = unwrapEntity(value, ['option']);
  const text = readString(record, ['text', 'label', 'value']) ?? `Option ${index + 1}`;

  return {
    id:
      readString(record, ['id', 'optionId']) ??
      `${slugifyFallback(text) || 'option'}-${index + 1}`,
    text,
    orderIndex: readNumber(record, ['orderIndex', 'order']) ?? index + 1,
  };
};

const buildTrueFalseFallbackOptions = (): StudentQuizQuestionOption[] => [
  { id: 'true', text: 'True', orderIndex: 1 },
  { id: 'false', text: 'False', orderIndex: 2 },
];

const normalizeQuestion = (
  value: unknown,
  index: number,
): StudentQuizQuestion => {
  const record = unwrapEntity(value, ['question']);
  const text = readString(record, ['text', 'questionText', 'title']) ?? `Question ${index + 1}`;
  const type = normalizeQuestionType(record.type ?? record.questionType);
  const options = unwrapCollection(record.options ?? record.answerOptions, ['options']).map(
    normalizeOption,
  );

  return {
    id:
      readString(record, ['id', 'questionId']) ??
      `${slugifyFallback(text) || 'question'}-${index + 1}`,
    text,
    description: readString(record, ['description', 'helpText', 'instructions']),
    type,
    marks: readNumber(record, ['marks', 'maxMarks', 'score']),
    orderIndex: readNumber(record, ['orderIndex', 'order']) ?? index + 1,
    options:
      type === QUIZ_QUESTION_TYPES.trueFalse && options.length === 0
        ? buildTrueFalseFallbackOptions()
        : options,
    unsupported: type === 6,
  };
};

const normalizeAttemptAnswer = (
  value: unknown,
  index: number,
): StudentQuizAttemptAnswer => {
  const record = unwrapEntity(value, ['answer']);
  const questionRecord = readRecord(record, ['question']);
  const questionText =
    readString(record, ['questionText']) ??
    (questionRecord ? readString(questionRecord, ['text', 'questionText']) : null) ??
    `Question ${index + 1}`;

  return {
    id:
      readString(record, ['id', 'answerId']) ??
      `${slugifyFallback(questionText) || 'answer'}-${index + 1}`,
    questionId:
      readString(record, ['questionId']) ??
      (questionRecord ? readString(questionRecord, ['id', 'questionId']) : null) ??
      '',
    questionText,
    questionType: normalizeQuestionType(
      record.questionType ?? record.type ?? questionRecord?.type ?? questionRecord?.questionType,
    ),
    answerText: readString(record, ['answerText', 'responseText', 'text']) ?? '',
    selectedOptionIds: readStringArray(record, ['selectedOptionIds']),
    fileReference: readString(record, ['fileReference', 'fileUrl', 'attachmentUrl']),
    awardedMarks: readNumber(record, ['awardedMarks', 'score', 'earnedMarks']),
    maxMarks:
      readNumber(record, ['maxMarks', 'marks']) ??
      (questionRecord ? readNumber(questionRecord, ['marks', 'maxMarks']) : null),
    teacherFeedback: readString(record, ['teacherFeedback', 'feedback']),
    needsManualGrading:
      readBoolean(record, ['needsManualGrading', 'requiresManualGrading', 'pendingManualGrade']) ??
      (hasDefinedValue(record, ['awardedMarks', 'score', 'earnedMarks']) ||
      hasDefinedValue(record, ['teacherFeedback', 'feedback'])
        ? false
        : null),
  };
};

const extractAttemptRecord = (record: Record<string, unknown>) => {
  const nestedAttempt = readRecord(record, [
    'attempt',
    'currentAttempt',
    'activeAttempt',
    'latestAttempt',
    'submission',
    'latestSubmission',
    'currentSubmission',
  ]);

  if (nestedAttempt) {
    return nestedAttempt;
  }

  const attemptCollection = readArray(record, ['attempts', 'submissions']);
  for (let index = attemptCollection.length - 1; index >= 0; index -= 1) {
    const candidate = attemptCollection[index];
    if (isRecord(candidate)) {
      return candidate;
    }
  }

  return null;
};

const extractAttemptStatus = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  (attemptRecord
    ? readString(attemptRecord, ['status', 'attemptStatus', 'submissionStatus'])
    : null) ??
  readString(record, [
    'latestAttemptStatus',
    'attemptStatus',
    'submissionStatus',
    'currentAttemptStatus',
    'lastAttemptStatus',
  ]);

const extractSubmittedAt = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  normalizeUtcDateTimeString(
    (attemptRecord
      ? readString(attemptRecord, ['submittedAt', 'completedAt', 'submittedOn', 'completedOn'])
      : null) ??
      readString(record, [
        'submittedAt',
        'completedAt',
        'latestSubmittedAt',
        'lastSubmittedAt',
        'submittedOn',
        'completedOn',
      ]),
  );

const extractStartedAt = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  normalizeUtcDateTimeString(
    (attemptRecord ? readString(attemptRecord, ['startedAt', 'startedOn']) : null) ??
      readString(record, ['startedAt', 'startedOn']),
  );

const extractResultsPublished = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  (attemptRecord
    ? readBoolean(attemptRecord, [
        'areResultsPublished',
        'resultsPublished',
        'isResultsPublished',
        'resultsVisible',
      ])
    : null) ??
  readBoolean(record, [
    'areResultsPublished',
    'resultsPublished',
    'isResultsPublished',
    'resultsVisible',
  ]);

const extractRawPercentage = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  (attemptRecord
    ? readNumber(attemptRecord, ['percentage', 'scorePercent', 'scorePercentage'])
    : null) ??
  readNumber(record, ['percentage', 'scorePercent', 'scorePercentage']);

const deriveScoreFromPercentage = (
  percentage: number | null,
  totalMarks: number | null,
) =>
  percentage != null && totalMarks != null && totalMarks > 0
    ? roundScore((percentage / 100) * totalMarks)
    : null;

const extractScore = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
  totalMarks: number | null,
  percentage: number | null,
) =>
  (attemptRecord ? readNumber(attemptRecord, ['score', 'earnedMarks', 'awardedMarks']) : null) ??
  readNumber(record, ['score', 'earnedMarks', 'awardedMarks']) ??
  deriveScoreFromPercentage(percentage, totalMarks);

const extractPercentage = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
  totalMarks: number | null,
  score: number | null,
) =>
  extractRawPercentage(record, attemptRecord) ??
  (score != null && totalMarks != null && totalMarks > 0 ? (score / totalMarks) * 100 : null);

const extractAnswersPendingGrading = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) =>
  (attemptRecord
    ? readNumber(attemptRecord, [
        'answersPendingGrading',
        'pendingManualGrades',
        'manualGradingCount',
      ])
    : null) ??
  readNumber(record, ['answersPendingGrading', 'pendingManualGrades', 'manualGradingCount']);

const extractRequiresManualGrading = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
  answersPendingGrading: number | null,
) =>
  (attemptRecord
    ? readBoolean(attemptRecord, [
        'requiresManualGrading',
        'needsManualGrading',
        'pendingManualGrade',
      ])
    : null) ??
  readBoolean(record, ['requiresManualGrading', 'needsManualGrading', 'pendingManualGrade']) ??
  (answersPendingGrading != null ? answersPendingGrading > 0 : null);

const extractAttemptCount = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
) => {
  const explicitCount = readNumber(record, [
    'attemptCount',
    'submissionCount',
    'totalAttempts',
    'attemptsCount',
  ]);

  if (explicitCount != null) {
    return Math.max(0, explicitCount);
  }

  const attempts = readArray(record, ['attempts', 'submissions']);
  if (attempts.length > 0) {
    return attempts.length;
  }

  return attemptRecord ? 1 : 0;
};

const inferQuizStatus = (
  record: Record<string, unknown>,
  attemptRecord: Record<string, unknown> | null,
): string | null => {
  const attemptStatus = extractAttemptStatus(record, attemptRecord);
  const submittedAt = extractSubmittedAt(record, attemptRecord);
  const startedAt = extractStartedAt(record, attemptRecord);
  const attemptCount = extractAttemptCount(record, attemptRecord);
  const allowMultipleAttempts = readBoolean(record, ['allowMultipleAttempts']);

  if (attemptStatus) {
    const displayStatus = getStudentQuizDisplayStatus(attemptStatus);

    if (displayStatus === 'Completed' && attemptCount > 0 && allowMultipleAttempts) {
      return 'Retake Available';
    }

    return displayStatus;
  }

  if (startedAt && !submittedAt) {
    return 'In Progress';
  }

  if (attemptCount > 0) {
    return allowMultipleAttempts ? 'Retake Available' : 'Completed';
  }

  if (submittedAt) {
    return 'Completed';
  }

  const explicitStatus = readString(record, ['status']);
  if (explicitStatus) {
    const displayStatus = getStudentQuizDisplayStatus(explicitStatus);

    if (displayStatus === 'Completed' && allowMultipleAttempts && attemptCount > 0) {
      return 'Retake Available';
    }

    return displayStatus;
  }

  const available = readBoolean(record, ['isAvailable', 'available']);
  if (available === false) {
    return 'Unavailable';
  }

  return 'Not Started';
};

const normalizeQuizSummary = (
  value: unknown,
): StudentQuizSummary => {
  const record = unwrapEntity(value, ['quiz']);
  const courseRecord = readRecord(record, ['course']);
  const attemptRecord = extractAttemptRecord(record);
  const questions = unwrapCollection(record.questions, ['questions']);
  const attemptStatus = extractAttemptStatus(record, attemptRecord);
  const submittedAt = extractSubmittedAt(record, attemptRecord);
  const startedAt = extractStartedAt(record, attemptRecord);
  const attemptCount = extractAttemptCount(record, attemptRecord);
  const inferredStatus = inferQuizStatus(record, attemptRecord);
  const totalMarks =
    (attemptRecord ? readNumber(attemptRecord, ['totalMarks', 'maxMarks']) : null) ??
    readNumber(record, ['totalMarks', 'maxMarks']);
  const rawPercentage = extractRawPercentage(record, attemptRecord);
  const score = extractScore(record, attemptRecord, totalMarks, rawPercentage);
  const percentage = extractPercentage(record, attemptRecord, totalMarks, score);
  const answersPendingGrading = extractAnswersPendingGrading(record, attemptRecord);
  const requiresManualGrading = extractRequiresManualGrading(
    record,
    attemptRecord,
    answersPendingGrading,
  );

  const normalizedQuiz: StudentQuizSummary = {
    id: readString(record, ['id', 'quizId']) ?? '',
    courseId:
      readString(record, ['courseId']) ??
      (courseRecord ? readString(courseRecord, ['id', 'courseId']) : null),
    courseTitle:
      readString(record, ['courseTitle', 'courseName']) ??
      (courseRecord ? readString(courseRecord, ['title', 'name']) : null),
    title: readString(record, ['title', 'quizTitle', 'name']) ?? 'Untitled Quiz',
    description: readString(record, ['description', 'summary']),
    instructions: readString(record, ['instructions', 'instructionText', 'description', 'summary']),
    durationMinutes: readNumber(record, ['durationMinutes', 'duration']),
    totalMarks,
    questionCount:
      readNumber(record, ['questionCount', 'questionsCount', 'totalQuestions']) ??
      questions.length,
    status: inferredStatus,
    availableFrom: normalizeUtcDateTimeString(
      readString(record, ['startTimeUtc', 'startsAt', 'availableFrom']),
    ),
    availableUntil: normalizeUtcDateTimeString(
      readString(record, ['endTimeUtc', 'endsAt', 'availableUntil']),
    ),
    availabilityLabel: readString(record, ['availabilityLabel', 'availability', 'availabilityText']),
    isPublished: readBoolean(record, ['isPublished', 'published']),
    areResultsPublished: extractResultsPublished(record, attemptRecord),
    isAvailable: readBoolean(record, ['isAvailable', 'available']),
    allowMultipleAttempts: readBoolean(record, ['allowMultipleAttempts']),
    score,
    percentage,
    answersPendingGrading,
    requiresManualGrading,
    attemptCount,
    activeAttemptId:
      (attemptRecord ? readString(attemptRecord, ['id', 'attemptId']) : null) ??
      readString(record, ['activeAttemptId', 'currentAttemptId', 'attemptId']),
    latestAttemptId:
      (attemptRecord ? readString(attemptRecord, ['id', 'attemptId']) : null) ??
      readString(record, ['latestAttemptId', 'attemptId']),
    latestAttemptStatus: attemptStatus ? getStudentQuizDisplayStatus(attemptStatus) : inferredStatus,
    startedAt,
    submittedAt,
    timeRemainingSeconds:
      (attemptRecord ? readNumber(attemptRecord, ['timeRemainingSeconds', 'remainingSeconds']) : null) ??
      readNumber(record, ['timeRemainingSeconds', 'remainingSeconds']),
    weekLabel:
      readString(record, ['weekLabel', 'weekName']) ??
      (typeof record.week === 'string' && record.week.trim() ? record.week.trim() : null),
    weekNumber:
      readNumber(record, ['weekNumber']) ??
      (typeof record.week === 'number' && Number.isFinite(record.week) ? record.week : null),
    moduleTitle: readString(record, ['moduleTitle', 'moduleName', 'module']),
    lessonTitle: readString(record, ['lessonTitle', 'lessonName', 'lesson']),
    sortOrder: readNumber(record, ['sortOrder', 'orderIndex']),
  };

  return normalizedQuiz;
};

const statusIncludesAny = (status: string | null | undefined, values: string[]) =>
  typeof status === 'string' &&
  values.some((value) => status.toLowerCase().includes(value));

const pickMergedQuizStatus = (
  summaryStatus: string | null,
  detailStatus: string | null,
) => {
  if (statusIncludesAny(detailStatus, ['in progress', 'started', 'active', 'ongoing'])) {
    return detailStatus;
  }

  if (statusIncludesAny(summaryStatus, ['completed', 'submitted', 'finished', 'attempted', 'retake'])) {
    return summaryStatus;
  }

  if (statusIncludesAny(summaryStatus, ['unavailable', 'not available', 'closed', 'expired'])) {
    return summaryStatus;
  }

  return summaryStatus ?? detailStatus;
};

const mergeStudentQuizSummary = (
  summary: StudentQuizSummary,
  detail: StudentQuizSummary,
): StudentQuizSummary => ({
  ...summary,
  ...detail,
  id: detail.id || summary.id,
  courseId: detail.courseId ?? summary.courseId,
  courseTitle: detail.courseTitle ?? summary.courseTitle,
  title: detail.title || summary.title,
  description: detail.description ?? summary.description,
  instructions: detail.instructions ?? summary.instructions,
  durationMinutes: detail.durationMinutes ?? summary.durationMinutes,
  totalMarks: detail.totalMarks ?? summary.totalMarks,
  questionCount: detail.questionCount ?? summary.questionCount,
  status: pickMergedQuizStatus(summary.status, detail.status),
  availableFrom: detail.availableFrom ?? summary.availableFrom,
  availableUntil: detail.availableUntil ?? summary.availableUntil,
  availabilityLabel: detail.availabilityLabel ?? summary.availabilityLabel,
  isPublished: detail.isPublished ?? summary.isPublished,
  areResultsPublished: detail.areResultsPublished ?? summary.areResultsPublished,
  isAvailable: detail.isAvailable ?? summary.isAvailable,
  allowMultipleAttempts: detail.allowMultipleAttempts ?? summary.allowMultipleAttempts,
  score: detail.score ?? summary.score,
  percentage: detail.percentage ?? summary.percentage,
  answersPendingGrading: detail.answersPendingGrading ?? summary.answersPendingGrading,
  requiresManualGrading: detail.requiresManualGrading ?? summary.requiresManualGrading,
  attemptCount: Math.max(detail.attemptCount, summary.attemptCount),
  activeAttemptId: detail.activeAttemptId ?? summary.activeAttemptId,
  latestAttemptId: detail.latestAttemptId ?? summary.latestAttemptId,
  latestAttemptStatus: pickMergedQuizStatus(summary.latestAttemptStatus, detail.latestAttemptStatus),
  startedAt: detail.startedAt ?? summary.startedAt,
  submittedAt: detail.submittedAt ?? summary.submittedAt,
  timeRemainingSeconds: detail.timeRemainingSeconds ?? summary.timeRemainingSeconds,
  weekLabel: detail.weekLabel ?? summary.weekLabel,
  weekNumber: detail.weekNumber ?? summary.weekNumber,
  moduleTitle: detail.moduleTitle ?? summary.moduleTitle,
  lessonTitle: detail.lessonTitle ?? summary.lessonTitle,
  sortOrder: detail.sortOrder ?? summary.sortOrder,
});

const mergeStudentQuizPartial = (
  summary: StudentQuizSummary,
  detail: Partial<StudentQuizSummary>,
): StudentQuizSummary => ({
  ...summary,
  ...detail,
  id: detail.id ?? summary.id,
  courseId: detail.courseId ?? summary.courseId,
  courseTitle: detail.courseTitle ?? summary.courseTitle,
  title: detail.title ?? summary.title,
  description: detail.description ?? summary.description,
  instructions: detail.instructions ?? summary.instructions,
  durationMinutes: detail.durationMinutes ?? summary.durationMinutes,
  totalMarks: detail.totalMarks ?? summary.totalMarks,
  questionCount: detail.questionCount ?? summary.questionCount,
  status: detail.status ?? summary.status,
  availableFrom: detail.availableFrom ?? summary.availableFrom,
  availableUntil: detail.availableUntil ?? summary.availableUntil,
  availabilityLabel: detail.availabilityLabel ?? summary.availabilityLabel,
  isPublished: detail.isPublished ?? summary.isPublished,
  areResultsPublished: detail.areResultsPublished ?? summary.areResultsPublished,
  isAvailable: detail.isAvailable ?? summary.isAvailable,
  allowMultipleAttempts: detail.allowMultipleAttempts ?? summary.allowMultipleAttempts,
  score: detail.score ?? summary.score,
  percentage: detail.percentage ?? summary.percentage,
  answersPendingGrading: detail.answersPendingGrading ?? summary.answersPendingGrading,
  requiresManualGrading: detail.requiresManualGrading ?? summary.requiresManualGrading,
  attemptCount: detail.attemptCount ?? summary.attemptCount,
  activeAttemptId: detail.activeAttemptId ?? summary.activeAttemptId,
  latestAttemptId: detail.latestAttemptId ?? summary.latestAttemptId,
  latestAttemptStatus: detail.latestAttemptStatus ?? summary.latestAttemptStatus,
  startedAt: detail.startedAt ?? summary.startedAt,
  submittedAt: detail.submittedAt ?? summary.submittedAt,
  timeRemainingSeconds: detail.timeRemainingSeconds ?? summary.timeRemainingSeconds,
  weekLabel: detail.weekLabel ?? summary.weekLabel,
  weekNumber: detail.weekNumber ?? summary.weekNumber,
  moduleTitle: detail.moduleTitle ?? summary.moduleTitle,
  lessonTitle: detail.lessonTitle ?? summary.lessonTitle,
  sortOrder: detail.sortOrder ?? summary.sortOrder,
});

const normalizeStudentQuizResult = (
  value: unknown,
  quizId: string,
): Partial<StudentQuizSummary> => {
  const record = unwrapEntity(value, ['result', 'quizResult']);
  const quizRecord = readRecord(record, ['quiz']);
  const courseRecord =
    readRecord(record, ['course']) ?? (quizRecord ? readRecord(quizRecord, ['course']) : null);
  const attemptRecord = extractAttemptRecord(record) ?? (quizRecord ? extractAttemptRecord(quizRecord) : null);
  const totalMarks =
    (attemptRecord ? readNumber(attemptRecord, ['totalMarks', 'maxMarks']) : null) ??
    readNumber(record, ['totalMarks', 'maxMarks']) ??
    (quizRecord ? readNumber(quizRecord, ['totalMarks', 'maxMarks']) : null);
  const rawPercentage =
    (attemptRecord ? readNumber(attemptRecord, ['percentage', 'scorePercent', 'scorePercentage']) : null) ??
    readNumber(record, ['percentage', 'scorePercent', 'scorePercentage', 'resultPercentage']) ??
    (quizRecord ? readNumber(quizRecord, ['percentage', 'scorePercent', 'scorePercentage']) : null);
  const score =
    (attemptRecord
      ? readNumber(attemptRecord, [
          'score',
          'earnedMarks',
          'awardedMarks',
          'obtainedMarks',
          'marksObtained',
        ])
      : null) ??
    readNumber(record, [
      'score',
      'earnedMarks',
      'awardedMarks',
      'obtainedMarks',
      'marksObtained',
    ]) ??
    (quizRecord
      ? readNumber(quizRecord, ['score', 'earnedMarks', 'awardedMarks'])
      : null) ??
    deriveScoreFromPercentage(rawPercentage, totalMarks);
  const percentage =
    rawPercentage ??
    (score != null && totalMarks != null && totalMarks > 0 ? (score / totalMarks) * 100 : null);
  const answersPendingGrading =
    (attemptRecord
      ? readNumber(attemptRecord, [
          'answersPendingGrading',
          'pendingManualGrades',
          'manualGradingCount',
        ])
      : null) ??
    readNumber(record, ['answersPendingGrading', 'pendingManualGrades', 'manualGradingCount']);
  const requiresManualGrading =
    (attemptRecord
      ? readBoolean(attemptRecord, [
          'requiresManualGrading',
          'needsManualGrading',
          'pendingManualGrade',
        ])
      : null) ??
    readBoolean(record, ['requiresManualGrading', 'needsManualGrading', 'pendingManualGrade']) ??
    (answersPendingGrading != null ? answersPendingGrading > 0 : null);
  const attemptStatus = extractAttemptStatus(record, attemptRecord);
  const startedAt =
    extractStartedAt(record, attemptRecord) ??
    normalizeUtcDateTimeString(readString(record, ['attemptedAt', 'startedAt']));
  const submittedAt =
    extractSubmittedAt(record, attemptRecord) ??
    normalizeUtcDateTimeString(readString(record, ['submittedAt', 'completedAt', 'attemptedAt']));
  const normalizedAttemptStatus = attemptStatus ? getStudentQuizDisplayStatus(attemptStatus) : null;

  return {
    id:
      readString(record, ['quizId', 'id']) ??
      (quizRecord ? readString(quizRecord, ['id', 'quizId']) : null) ??
      quizId,
    courseId:
      readString(record, ['courseId']) ??
      (quizRecord ? readString(quizRecord, ['courseId']) : null) ??
      (courseRecord ? readString(courseRecord, ['id', 'courseId']) : null),
    courseTitle:
      readString(record, ['courseTitle', 'courseName']) ??
      (quizRecord ? readString(quizRecord, ['courseTitle', 'courseName']) : null) ??
      (courseRecord ? readString(courseRecord, ['title', 'name']) : null),
    title:
      readString(record, ['quizTitle', 'title', 'name']) ??
      (quizRecord ? readString(quizRecord, ['title', 'quizTitle', 'name']) : null) ??
      'Untitled Quiz',
    totalMarks,
    score,
    percentage,
    areResultsPublished:
      (attemptRecord
        ? readBoolean(attemptRecord, [
            'areResultsPublished',
            'resultsPublished',
            'isResultsPublished',
            'resultsVisible',
            'isPublished',
            'published',
          ])
        : null) ??
      readBoolean(record, [
        'areResultsPublished',
        'resultsPublished',
        'isResultsPublished',
        'resultsVisible',
        'isPublished',
        'published',
      ]) ??
      (quizRecord ? readBoolean(quizRecord, ['areResultsPublished', 'resultsPublished']) : null),
    answersPendingGrading,
    requiresManualGrading,
    latestAttemptId:
      (attemptRecord ? readString(attemptRecord, ['id', 'attemptId']) : null) ??
      readString(record, ['attemptId', 'latestAttemptId']),
    latestAttemptStatus:
      normalizedAttemptStatus ??
      (submittedAt ? 'Completed' : startedAt ? 'In Progress' : null),
    startedAt,
    submittedAt,
    status: normalizedAttemptStatus ?? (submittedAt ? 'Completed' : startedAt ? 'In Progress' : null),
  };
};

const normalizeAttemptDetail = (
  value: unknown,
  quizId: string,
): StudentQuizAttemptDetail => {
  const record = unwrapEntity(value, ['attempt']);
  const quizRecord = readRecord(record, ['quiz']);
  const quizSummary = normalizeQuizSummary(quizRecord ?? record);
  const questions = unwrapCollection(
    record.questions ?? quizRecord?.questions,
    ['questions'],
  ).map(normalizeQuestion);
  const answers = unwrapCollection(record.answers, ['answers']).map(normalizeAttemptAnswer);
  const totalMarksFromAnswers = answers.reduce(
    (total, answer) => total + (answer.maxMarks ?? 0),
    0,
  );
  const scoreFromAnswers = answers.reduce(
    (total, answer) => total + (answer.awardedMarks ?? 0),
    0,
  );
  const hasAnyAwardedMarks = answers.some((answer) => answer.awardedMarks != null);
  const answerNeedsManualFlags = answers
    .map((answer) => answer.needsManualGrading)
    .filter((value): value is boolean => value != null);
  const totalMarks =
    readNumber(record, ['totalMarks', 'maxMarks']) ??
    quizSummary.totalMarks ??
    (totalMarksFromAnswers > 0 ? totalMarksFromAnswers : null);
  const rawPercentage =
    readNumber(record, ['percentage', 'scorePercent', 'scorePercentage']) ?? quizSummary.percentage;
  const score =
    readNumber(record, ['score', 'earnedMarks', 'awardedMarks']) ??
    quizSummary.score ??
    (hasAnyAwardedMarks ? scoreFromAnswers : deriveScoreFromPercentage(rawPercentage, totalMarks));
  const percentage =
    rawPercentage ??
    (score != null && totalMarks != null && totalMarks > 0
      ? (score / totalMarks) * 100
      : quizSummary.percentage);
  const answersPendingGrading =
    readNumber(record, ['answersPendingGrading', 'pendingManualGrades', 'manualGradingCount']) ??
    quizSummary.answersPendingGrading ??
    (answerNeedsManualFlags.length > 0
      ? answerNeedsManualFlags.filter(Boolean).length
      : null);
  const requiresManualGrading =
    readBoolean(record, ['requiresManualGrading', 'needsManualGrading', 'pendingManualGrade']) ??
    quizSummary.requiresManualGrading ??
    (answerNeedsManualFlags.length > 0 ? answerNeedsManualFlags.some(Boolean) : null) ??
    (answersPendingGrading != null ? answersPendingGrading > 0 : null);

  return {
    id: readString(record, ['id', 'attemptId']) ?? '',
    quizId:
      readString(record, ['quizId']) ??
      (quizRecord ? readString(quizRecord, ['id', 'quizId']) : null) ??
      quizId,
    quizTitle:
      readString(record, ['quizTitle']) ??
      (quizRecord ? readString(quizRecord, ['title', 'quizTitle', 'name']) : null) ??
      quizSummary.title,
    courseId:
      readString(record, ['courseId']) ??
      (quizRecord ? readString(quizRecord, ['courseId']) : null) ??
      quizSummary.courseId,
    courseTitle:
      readString(record, ['courseTitle']) ??
      (quizRecord ? readString(quizRecord, ['courseTitle', 'courseName']) : null) ??
      quizSummary.courseTitle,
    description: readString(record, ['description', 'summary']) ?? quizSummary.description,
    instructions:
      readString(record, ['instructions', 'instructionText']) ?? quizSummary.instructions,
    durationMinutes:
      readNumber(record, ['durationMinutes', 'duration']) ?? quizSummary.durationMinutes,
    totalMarks,
    questionCount:
      readNumber(record, ['questionCount', 'questionsCount', 'totalQuestions']) ??
      (questions.length > 0 ? questions.length : quizSummary.questionCount),
    status: getStudentQuizDisplayStatus(inferQuizStatus(record, null)),
    availableFrom:
      normalizeUtcDateTimeString(
        readString(record, ['availableFrom', 'startTimeUtc', 'startsAt']),
      ) ?? quizSummary.availableFrom,
    availableUntil:
      normalizeUtcDateTimeString(
        readString(record, ['availableUntil', 'endTimeUtc', 'endsAt']),
      ) ?? quizSummary.availableUntil,
    availabilityLabel:
      readString(record, ['availabilityLabel', 'availability', 'availabilityText']) ??
      quizSummary.availabilityLabel,
    isPublished: readBoolean(record, ['isPublished', 'published']) ?? quizSummary.isPublished,
    areResultsPublished:
      readBoolean(record, [
        'areResultsPublished',
        'resultsPublished',
        'isResultsPublished',
        'resultsVisible',
      ]) ?? quizSummary.areResultsPublished,
    isAvailable: readBoolean(record, ['isAvailable', 'available']) ?? quizSummary.isAvailable,
    allowMultipleAttempts:
      readBoolean(record, ['allowMultipleAttempts']) ?? quizSummary.allowMultipleAttempts,
    score,
    percentage,
    answersPendingGrading,
    requiresManualGrading,
    startedAt: normalizeUtcDateTimeString(readString(record, ['startedAt', 'startedOn'])),
    submittedAt: normalizeUtcDateTimeString(
      readString(record, ['submittedAt', 'completedAt', 'submittedOn']),
    ),
    timeRemainingSeconds:
      readNumber(record, ['timeRemainingSeconds', 'remainingSeconds']) ??
      quizSummary.timeRemainingSeconds,
    questions,
    answers,
  };
};

const extractEntityId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const record = unwrapEntity(value, ['attempt', 'quiz', 'question']);
  return readString(record, ['id', 'attemptId', 'quizId', 'questionId']);
};

const extractIdFromLocation = (location?: string): string | null => {
  if (!location) return null;

  const normalized = location.replace(/\/+$/, '');
  const id = normalized.split('/').at(-1);
  return id && id.length > 0 ? id : null;
};

export const getStudentQuizErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong while loading quiz data.',
): string => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (isRecord(responseData)) {
    const message =
      readString(responseData, ['message', 'title', 'detail', 'error']) ??
      readString(readRecord(responseData, ['errors']) ?? {}, ['']);

    if (message) {
      return message;
    }
  }

  return error.message || fallback;
};

const convertQuizError = (
  error: unknown,
  fallback = 'Something went wrong while loading quiz data.',
): never => {
  if (isAxiosError(error)) {
    throw new StudentQuizApiError(getStudentQuizErrorMessage(error, fallback), error.response?.status ?? 0);
  }

  if (error instanceof Error) {
    throw new StudentQuizApiError(error.message, 0);
  }

  throw new StudentQuizApiError(fallback, 0);
};

export const isQuizSubmittedStatus = (status?: string | null) =>
  typeof status === 'string' &&
  ['submitted', 'completed', 'finished', 'attempted'].some((value) => status.toLowerCase().includes(value));

export const isQuizInProgressStatus = (status?: string | null) =>
  typeof status === 'string' &&
  ['in progress', 'started', 'active', 'ongoing'].some((value) => status.toLowerCase().includes(value));

export const isQuizUnavailableStatus = (status?: string | null) =>
  typeof status === 'string' &&
  ['unavailable', 'not available', 'closed', 'expired'].some((value) =>
    status.toLowerCase().includes(value),
  );

export const isQuizRetakeAvailableStatus = (status?: string | null) =>
  typeof status === 'string' && status.toLowerCase().includes('retake');

type StudentQuizAttemptState = {
  attemptCount?: number;
  activeAttemptId?: string | null;
  latestAttemptId?: string | null;
  status?: string | null;
  latestAttemptStatus?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
};

export const hasStudentQuizAttempt = (quiz?: StudentQuizAttemptState | null) => {
  if (!quiz) {
    return false;
  }

  return Boolean(
    (quiz.attemptCount ?? 0) > 0 ||
      quiz.activeAttemptId ||
      quiz.latestAttemptId ||
      quiz.startedAt ||
      quiz.submittedAt ||
      isQuizInProgressStatus(quiz.status) ||
      isQuizSubmittedStatus(quiz.status) ||
      isQuizRetakeAvailableStatus(quiz.status) ||
      isQuizInProgressStatus(quiz.latestAttemptStatus) ||
      isQuizSubmittedStatus(quiz.latestAttemptStatus),
  );
};

export const hasStudentQuizCompletedAttempt = (quiz?: StudentQuizAttemptState | null) => {
  if (!quiz) {
    return false;
  }

  return Boolean(
    quiz.submittedAt ||
      isQuizSubmittedStatus(quiz.status) ||
      isQuizRetakeAvailableStatus(quiz.status) ||
      isQuizSubmittedStatus(quiz.latestAttemptStatus) ||
      ((quiz.attemptCount ?? 0) > 0 &&
        !quiz.activeAttemptId &&
        !isQuizInProgressStatus(quiz.status) &&
        !isQuizInProgressStatus(quiz.latestAttemptStatus)),
  );
};

export const createEmptyStudentQuizDraft = (questionId: string): StudentQuizAnswerDraft => ({
  questionId,
  selectedOptionIds: [],
  answerText: '',
  fileReference: null,
});

export const buildStudentQuizDraftsFromAttempt = (
  attempt: StudentQuizAttemptDetail,
): Record<string, StudentQuizAnswerDraft> =>
  attempt.questions.reduce<Record<string, StudentQuizAnswerDraft>>((accumulator, question) => {
    const answer = attempt.answers.find((item) => item.questionId === question.id);
    accumulator[question.id] = {
      questionId: question.id,
      selectedOptionIds: answer?.selectedOptionIds ?? [],
      answerText: answer?.answerText ?? '',
      fileReference: answer?.fileReference ?? null,
    };
    return accumulator;
  }, {});

export const buildStudentQuizSubmitPayload = (
  questions: StudentQuizQuestion[],
  answers: Record<string, StudentQuizAnswerDraft>,
): SubmitQuizAttemptDto => ({
  answers: questions.map((question) => {
    const answer = answers[question.id] ?? createEmptyStudentQuizDraft(question.id);
    return {
      questionId: question.id,
      selectedOptionIds:
        answer.selectedOptionIds.length > 0 ? [...answer.selectedOptionIds] : null,
      answerText: answer.answerText.trim() ? answer.answerText.trim() : null,
      fileReference: answer.fileReference?.trim() ? answer.fileReference.trim() : null,
    };
  }),
});

export async function getStudentQuizzes(): Promise<StudentQuizSummary[]> {
  try {
    const { data } = await apiClient.get<unknown>(STUDENT_QUIZZES_PATH);
    return unwrapCollection(data, ['quizzes'])
      .map((quiz) => normalizeQuizSummary(quiz))
      .filter((quiz) => quiz.id);
  } catch (error) {
    throw convertQuizError(error, 'Unable to load student quizzes.');
  }
}

export async function getStudentQuizSummaryById(
  quizId: string,
): Promise<StudentQuizSummary | null> {
  const quizzes = await getStudentQuizzes();
  return quizzes.find((quiz) => quiz.id === quizId) ?? null;
}

export async function getStudentQuizResult(
  quizId: string,
): Promise<Partial<StudentQuizSummary>> {
  try {
    const { data } = await apiClient.get<unknown>(buildApiPath(STUDENT_QUIZ_RESULT_PATH, { quizId }));
    return normalizeStudentQuizResult(data, quizId);
  } catch (error) {
    throw convertQuizError(error, 'Unable to load this quiz result.');
  }
}

export async function getStudentQuizById(quizId: string): Promise<StudentQuizSummary> {
  try {
    const [detailResponse, summaryQuiz, resultQuiz] = await Promise.all([
      apiClient.get<unknown>(buildApiPath(STUDENT_QUIZ_DETAIL_PATH, { quizId })),
      getStudentQuizSummaryById(quizId).catch(() => null),
      getStudentQuizResult(quizId).catch(() => null),
    ]);
    const detailQuiz = normalizeQuizSummary(detailResponse.data);
    const mergedQuiz = summaryQuiz ? mergeStudentQuizSummary(summaryQuiz, detailQuiz) : detailQuiz;
    const quiz = resultQuiz ? mergeStudentQuizPartial(mergedQuiz, resultQuiz) : mergedQuiz;

    return {
      ...quiz,
      id: quiz.id || quizId,
    };
  } catch (error) {
    throw convertQuizError(error, 'Unable to load this quiz.');
  }
}

export async function getStudentQuizAttemptDetail(
  attemptId: string,
  quizId = '',
): Promise<StudentQuizAttemptDetail> {
  try {
    const { data } = await apiClient.get<unknown>(
      buildApiPath(STUDENT_QUIZ_ATTEMPT_PATH, { attemptId }),
    );
    const detail = normalizeAttemptDetail(data, quizId);
    return {
      ...detail,
      id: detail.id || attemptId,
    };
  } catch (error) {
    throw convertQuizError(error, 'Unable to load this quiz attempt.');
  }
}

export async function startStudentQuizAttempt(
  quizId: string,
): Promise<StudentQuizAttemptDetail> {
  try {
    const response = await apiClient.post<unknown>(buildApiPath(STUDENT_QUIZ_START_PATH, { quizId }));
    const normalized = normalizeAttemptDetail(response.data, quizId);

    if (normalized.id || normalized.questions.length > 0) {
      const normalizedAttempt = {
        ...normalized,
        id:
          normalized.id ||
          extractEntityId(response.data) ||
          extractIdFromLocation(response.headers.location) ||
          '',
      };
      return normalizedAttempt;
    }

    const attemptId =
      extractEntityId(response.data) ?? extractIdFromLocation(response.headers.location);

    if (attemptId) {
      return getStudentQuizAttemptDetail(attemptId, quizId);
    }

    const quiz = await getStudentQuizById(quizId);
    const fallbackAttemptId = quiz.activeAttemptId ?? quiz.latestAttemptId;

    if (fallbackAttemptId) {
      return getStudentQuizAttemptDetail(fallbackAttemptId, quizId);
    }

    throw new StudentQuizApiError('Quiz attempt started, but no attempt details were returned.', 0);
  } catch (error) {
    throw convertQuizError(error, 'Unable to start this quiz.');
  }
}

export async function submitStudentQuizAttempt(
  attemptId: string,
  payload: SubmitQuizAttemptDto,
): Promise<void> {
  try {
    await apiClient.post(buildApiPath(STUDENT_QUIZ_SUBMIT_PATH, { attemptId }), payload);
  } catch (error) {
    throw convertQuizError(error, 'Unable to submit this quiz.');
  }
}
