import { isAxiosError } from 'axios';

import { apiClient } from '@/lib/http';
import type {
  CreateQuestionDto,
  CreateQuizDto,
  ManualGradeAnswerDto,
  QuestionType,
  UpdateQuestionDto,
  UpdateQuizDto,
} from '@/generated/api-types';
import {
  QUIZ_QUESTION_TYPES,
  questionTypeNeedsManualGrading,
  type TeacherQuizAttemptAnswer,
  type TeacherQuizAttemptDetail,
  type TeacherQuizAttemptSummary,
  type TeacherQuizDetail,
  type TeacherQuizOption,
  type TeacherQuizQuestion,
  type TeacherQuizSummary,
} from '@/features/teacher/quizzes/types';
import { slugifyFallback } from '@/features/teacher/quizzes/utils';

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
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }

  return null;
};

const hasDefinedValue = (record: Record<string, unknown>, keys: string[]): boolean =>
  keys.some((key) => key in record && record[key] !== null && record[key] !== undefined);

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

const readStringArray = (record: Record<string, unknown>, keys: string[]): string[] => {
  return readArray(record, keys)
    .map((value) => (typeof value === 'string' ? value.trim() : null))
    .filter((value): value is string => Boolean(value));
};

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

const normalizeOption = (value: unknown, index: number): TeacherQuizOption => {
  const record = unwrapEntity(value, ['option']);
  const text = readString(record, ['text', 'label', 'value']) ?? `Option ${index + 1}`;

  return {
    id:
      readString(record, ['id', 'optionId']) ??
      `${slugifyFallback(text) || 'option'}-${index + 1}`,
    text,
    isCorrect: readBoolean(record, ['isCorrect', 'correct']) ?? false,
    orderIndex: readNumber(record, ['orderIndex', 'order']) ?? index + 1,
  };
};

const normalizeQuestion = (value: unknown, index: number): TeacherQuizQuestion => {
  const record = unwrapEntity(value, ['question']);
  const text = readString(record, ['text', 'questionText', 'title']) ?? `Question ${index + 1}`;
  const options = unwrapCollection(record.options ?? record.answerOptions, ['options']).map(
    normalizeOption,
  );

  return {
    id:
      readString(record, ['id', 'questionId']) ??
      `${slugifyFallback(text) || 'question'}-${index + 1}`,
    text,
    type: normalizeQuestionType(record.type ?? record.questionType),
    marks: readNumber(record, ['marks', 'maxMarks', 'score']) ?? 0,
    orderIndex: readNumber(record, ['orderIndex', 'order']) ?? index + 1,
    options,
  };
};

const normalizeQuiz = (value: unknown): TeacherQuizDetail => {
  const record = unwrapEntity(value, ['quiz']);
  const courseRecord = readRecord(record, ['course']);
  const questions = unwrapCollection(record.questions, ['questions']);
  const questionCountFromArray = questions.length;
  const score = readNumber(record, ['score', 'averageScore']) ?? 0;
  const totalMarks = readNumber(record, ['totalMarks', 'maxMarks']) ?? 0;

  return {
    id: readString(record, ['id', 'quizId']) ?? '',
    courseId:
      readString(record, ['courseId']) ??
      (courseRecord ? readString(courseRecord, ['id', 'courseId']) : null) ??
      '',
    courseTitle:
      readString(record, ['courseTitle', 'courseName']) ??
      (courseRecord ? readString(courseRecord, ['title', 'name']) : null) ??
      'Untitled Course',
    title: readString(record, ['title', 'quizTitle', 'name']) ?? 'Untitled Quiz',
    description: readString(record, ['description', 'summary']) ?? '',
    durationMinutes: readNumber(record, ['durationMinutes', 'duration']) ?? 0,
    totalMarks,
    questionCount:
      readNumber(record, ['questionCount', 'totalQuestions', 'questionsCount']) ??
      questionCountFromArray,
    submissionCount:
      readNumber(record, ['submissionCount', 'attemptCount', 'attempts', 'totalAttempts']) ?? 0,
    averageScorePercent:
      readNumber(record, ['averageScorePercent', 'avgScorePercent', 'percentage']) ??
      (totalMarks > 0 ? (score / totalMarks) * 100 : 0),
    isPublished: readBoolean(record, ['isPublished', 'published']) ?? false,
    areResultsPublished:
      readBoolean(record, ['areResultsPublished', 'resultsPublished']) ?? false,
    randomizeQuestions: readBoolean(record, ['randomizeQuestions']) ?? false,
    allowMultipleAttempts: readBoolean(record, ['allowMultipleAttempts']) ?? false,
    startTimeUtc: readString(record, ['startTimeUtc', 'startsAt', 'availableFrom']),
    endTimeUtc: readString(record, ['endTimeUtc', 'endsAt', 'availableUntil']),
    createdAt: readString(record, ['createdAt', 'createdOn']),
  };
};

const normalizeAttemptAnswer = (
  value: unknown,
  index: number,
): TeacherQuizAttemptAnswer => {
  const record = unwrapEntity(value, ['answer']);
  const questionRecord = readRecord(record, ['question']);
  const questionText =
    readString(record, ['questionText']) ??
    (questionRecord ? readString(questionRecord, ['text', 'questionText']) : null) ??
    `Question ${index + 1}`;
  const questionType = normalizeQuestionType(
    record.questionType ?? record.type ?? questionRecord?.type ?? questionRecord?.questionType,
  );
  const options = (
    questionRecord ? unwrapCollection(questionRecord.options, ['options']) : []
  ).map(normalizeOption);
  const selectedOptionTexts = [
    ...readStringArray(record, ['selectedOptionTexts']),
    ...unwrapCollection(record.selectedOptions, ['selectedOptions'])
      .map((selected) => {
        const selectedRecord = unwrapEntity(selected, ['option']);
        return readString(selectedRecord, ['text', 'label', 'value']);
      })
      .filter((option): option is string => Boolean(option)),
  ];
  const maxMarks =
    readNumber(record, ['maxMarks', 'marks']) ??
    (questionRecord ? readNumber(questionRecord, ['marks', 'maxMarks']) : null) ??
    0;
  const awardedMarks = readNumber(record, ['awardedMarks', 'score', 'earnedMarks']);
  const explicitNeedsManualGrading = readBoolean(record, [
    'needsManualGrading',
    'requiresManualGrading',
    'pendingManualGrade',
  ]);
  const gradingStatus = readString(record, ['gradingStatus', 'gradeStatus', 'status']);
  const isManuallyGraded =
    questionTypeNeedsManualGrading(questionType) &&
    (readBoolean(record, ['isGraded', 'graded']) === true ||
      Boolean(readString(record, ['gradedAt', 'gradedOn'])) ||
      hasDefinedValue(record, ['teacherFeedback', 'feedback']) ||
      hasDefinedValue(record, ['awardedMarks', 'score', 'earnedMarks']) ||
      (typeof gradingStatus === 'string' &&
        ['graded', 'complete', 'completed', 'reviewed'].some((value) =>
          gradingStatus.toLowerCase().includes(value),
        )));

  return {
    id:
      readString(record, ['id', 'answerId']) ??
      `${slugifyFallback(questionText) || 'answer'}-${index + 1}`,
    questionId:
      readString(record, ['questionId']) ??
      (questionRecord ? readString(questionRecord, ['id', 'questionId']) : null) ??
      '',
    questionText,
    questionType,
    maxMarks,
    awardedMarks,
    isCorrect:
      readBoolean(record, ['isCorrect', 'correct']) ??
      (questionTypeNeedsManualGrading(questionType) ? null : false),
    answerText: readString(record, ['answerText', 'responseText', 'text']) ?? '',
    selectedOptionIds: readStringArray(record, ['selectedOptionIds']),
    selectedOptionTexts,
    options,
    teacherFeedback: readString(record, ['teacherFeedback', 'feedback']) ?? '',
    needsManualGrading:
      explicitNeedsManualGrading ??
      (questionTypeNeedsManualGrading(questionType) ? !isManuallyGraded : false),
  };
};

const normalizeAttemptSummary = (value: unknown): TeacherQuizAttemptSummary => {
  const record = unwrapEntity(value, ['attempt']);
  const studentRecord = readRecord(record, ['student', 'user']);
  const studentName =
    readString(record, ['studentName', 'fullName']) ??
    (
      [
        studentRecord ? readString(studentRecord, ['firstName']) : null,
        studentRecord ? readString(studentRecord, ['lastName']) : null,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Student'
    );
  const score = readNumber(record, ['score', 'earnedMarks', 'awardedMarks']) ?? 0;
  const totalMarks = readNumber(record, ['totalMarks', 'maxMarks']) ?? 0;
  const percentage =
    readNumber(record, ['percentage', 'scorePercent', 'scorePercentage']) ??
    (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
  const answersPendingGrading =
    readNumber(record, ['answersPendingGrading', 'pendingManualGrades', 'manualGradingCount']) ??
    0;

  return {
    id: readString(record, ['id', 'attemptId']) ?? '',
    studentId:
      readString(record, ['studentId']) ??
      (studentRecord ? readString(studentRecord, ['id', 'studentId']) : null) ??
      '',
    studentName,
    status: readString(record, ['status']) ?? 'Unknown',
    startedAt: readString(record, ['startedAt', 'startedOn']),
    submittedAt: readString(record, ['submittedAt', 'completedAt', 'submittedOn']),
    score,
    totalMarks,
    percentage,
    requiresManualGrading:
      readBoolean(record, ['requiresManualGrading', 'needsManualGrading']) ??
      answersPendingGrading > 0,
    answersPendingGrading,
  };
};

const normalizeAttemptDetail = (value: unknown, quizId: string): TeacherQuizAttemptDetail => {
  const record = unwrapEntity(value, ['attempt']);
  const baseAttempt = normalizeAttemptSummary(record);
  const answers = unwrapCollection(record.answers, ['answers']).map(normalizeAttemptAnswer);
  const explicitAnswersPendingGrading = readNumber(record, [
    'answersPendingGrading',
    'pendingManualGrades',
    'manualGradingCount',
  ]);
  const answersPendingGrading =
    explicitAnswersPendingGrading ?? answers.filter((answer) => answer.needsManualGrading).length;
  const totalMarksFromAnswers = answers.reduce((total, answer) => total + answer.maxMarks, 0);
  const scoreFromAnswers = answers.reduce(
    (total, answer) => total + (answer.awardedMarks ?? 0),
    0,
  );
  const hasAnyAwardedMarks = answers.some((answer) => answer.awardedMarks != null);
  const explicitRequiresManualGrading = readBoolean(record, ['requiresManualGrading', 'needsManualGrading']);

  return {
    ...baseAttempt,
    quizId:
      readString(record, ['quizId']) ??
      (readRecord(record, ['quiz']) ? readString(readRecord(record, ['quiz'])!, ['id', 'quizId']) : null) ??
      quizId,
    quizTitle:
      readString(record, ['quizTitle']) ??
      (readRecord(record, ['quiz']) ? readString(readRecord(record, ['quiz'])!, ['title', 'quizTitle']) : null) ??
      'Quiz Attempt',
    score: hasAnyAwardedMarks ? scoreFromAnswers : baseAttempt.score,
    totalMarks: totalMarksFromAnswers > 0 ? totalMarksFromAnswers : baseAttempt.totalMarks,
    percentage:
      (totalMarksFromAnswers > 0 && hasAnyAwardedMarks
        ? (scoreFromAnswers / totalMarksFromAnswers) * 100
        : baseAttempt.percentage),
    requiresManualGrading:
      explicitRequiresManualGrading ?? answersPendingGrading > 0,
    answersPendingGrading,
    answers,
  };
};

const extractEntityId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const record = unwrapEntity(value, ['quiz', 'question', 'attempt']);
  return readString(record, ['id', 'quizId', 'questionId', 'attemptId']);
};

const extractIdFromLocation = (location?: string): string | null => {
  if (!location) return null;

  const normalized = location.replace(/\/+$/, '');
  const id = normalized.split('/').at(-1);
  return id && id.length > 0 ? id : null;
};

export const getTeacherQuizErrorMessage = (
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

export async function getTeacherQuizzesByCourse(courseId: string): Promise<TeacherQuizSummary[]> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/quizzes/course/${courseId}`);
  return unwrapCollection(data, ['quizzes']).map(normalizeQuiz);
}

export async function getTeacherQuizById(quizId: string): Promise<TeacherQuizDetail> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/quizzes/${quizId}`);
  return normalizeQuiz(data);
}

export async function createTeacherQuiz(payload: CreateQuizDto): Promise<string | null> {
  const response = await apiClient.post<unknown>('/api/v1/teacher/quizzes', payload);
  return extractEntityId(response.data) ?? extractIdFromLocation(response.headers.location);
}

export async function updateTeacherQuiz(quizId: string, payload: UpdateQuizDto): Promise<void> {
  await apiClient.put(`/api/v1/teacher/quizzes/${quizId}`, payload);
}

export async function deleteTeacherQuiz(quizId: string): Promise<void> {
  await apiClient.delete(`/api/v1/teacher/quizzes/${quizId}`);
}

export async function publishTeacherQuizResults(quizId: string): Promise<void> {
  await apiClient.post(`/api/v1/teacher/quizzes/${quizId}/results/publish`);
}

export async function unpublishTeacherQuizResults(quizId: string): Promise<void> {
  await apiClient.post(`/api/v1/teacher/quizzes/${quizId}/results/unpublish`);
}

export async function getTeacherQuizQuestions(
  quizId: string,
): Promise<TeacherQuizQuestion[]> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/quizzes/${quizId}/questions`);
  return unwrapCollection(data, ['questions']).map(normalizeQuestion);
}

export async function createTeacherQuizQuestion(
  quizId: string,
  payload: CreateQuestionDto,
): Promise<string | null> {
  const response = await apiClient.post<unknown>(
    `/api/v1/teacher/quizzes/${quizId}/questions`,
    payload,
  );

  return extractEntityId(response.data) ?? extractIdFromLocation(response.headers.location);
}

export async function updateTeacherQuizQuestion(
  quizId: string,
  questionId: string,
  payload: UpdateQuestionDto,
): Promise<void> {
  await apiClient.put(`/api/v1/teacher/quizzes/${quizId}/questions/${questionId}`, payload);
}

export async function deleteTeacherQuizQuestion(
  quizId: string,
  questionId: string,
): Promise<void> {
  await apiClient.delete(`/api/v1/teacher/quizzes/${quizId}/questions/${questionId}`);
}

export async function getTeacherQuizAttempts(
  quizId: string,
): Promise<TeacherQuizAttemptSummary[]> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/quizzes/${quizId}/attempts`);
  return unwrapCollection(data, ['attempts']).map(normalizeAttemptSummary);
}

export async function getTeacherQuizAttemptDetail(
  quizId: string,
  attemptId: string,
): Promise<TeacherQuizAttemptDetail> {
  const { data } = await apiClient.get<unknown>(
    `/api/v1/teacher/quizzes/${quizId}/attempts/${attemptId}`,
  );

  const detail = normalizeAttemptDetail(data, quizId);
  return {
    ...detail,
    id: detail.id || attemptId,
  };
}

export async function manualGradeTeacherQuizAnswer(
  quizId: string,
  attemptId: string,
  answerId: string,
  payload: ManualGradeAnswerDto,
): Promise<void> {
  await apiClient.put(
    `/api/v1/teacher/quizzes/${quizId}/attempts/${attemptId}/answers/${answerId}/grade`,
    payload,
  );
}
