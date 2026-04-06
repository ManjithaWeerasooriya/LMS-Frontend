import type { QuestionType } from '@/generated/api-types';

export const QUIZ_QUESTION_TYPES = {
  singleMcq: 1,
  multipleMcq: 2,
  trueFalse: 3,
  shortAnswer: 4,
  essay: 5,
} as const;

export type SupportedQuizQuestionType =
  (typeof QUIZ_QUESTION_TYPES)[keyof typeof QUIZ_QUESTION_TYPES];

export type TeacherQuizSummary = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  submissionCount: number;
  averageScorePercent: number;
  isPublished: boolean;
  areResultsPublished: boolean;
  randomizeQuestions: boolean;
  allowMultipleAttempts: boolean;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  createdAt: string | null;
};

export type TeacherQuizDetail = TeacherQuizSummary;

export type TeacherQuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type TeacherQuizQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  marks: number;
  orderIndex: number;
  options: TeacherQuizOption[];
};

export type TeacherQuizAttemptSummary = {
  id: string;
  studentId: string;
  studentName: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  requiresManualGrading: boolean;
  answersPendingGrading: number;
};

export type TeacherQuizAttemptAnswer = {
  id: string;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  maxMarks: number;
  awardedMarks: number | null;
  isCorrect: boolean | null;
  answerText: string;
  selectedOptionIds: string[];
  selectedOptionTexts: string[];
  options: TeacherQuizOption[];
  teacherFeedback: string;
  needsManualGrading: boolean;
};

export type TeacherQuizAttemptDetail = {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  requiresManualGrading: boolean;
  answersPendingGrading: number;
  answers: TeacherQuizAttemptAnswer[];
};

export type QuizEditorValues = {
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  startTimeLocal: string;
  endTimeLocal: string;
  randomizeQuestions: boolean;
  allowMultipleAttempts: boolean;
  isPublished: boolean;
  areResultsPublished: boolean;
};

export type QuestionOptionFormValue = {
  id?: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type QuestionEditorValues = {
  id?: string;
  text: string;
  type: SupportedQuizQuestionType;
  marks: number;
  orderIndex: number;
  options: QuestionOptionFormValue[];
};

export type ManualGradeFormValue = {
  awardedMarks: number;
  teacherFeedback: string;
};

export type TeacherQuizAnalytics = {
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  totalMarks: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  failPercentage: number;
  participationRate: number;
  totalEnrolledStudents: number;
  studentsParticipated: number;
};

export const quizQuestionTypeOptions: Array<{
  label: string;
  value: SupportedQuizQuestionType;
  description: string;
}> = [
  {
    label: 'Single MCQ',
    value: QUIZ_QUESTION_TYPES.singleMcq,
    description: 'One correct answer from multiple options.',
  },
  {
    label: 'Multiple MCQ',
    value: QUIZ_QUESTION_TYPES.multipleMcq,
    description: 'More than one option can be correct.',
  },
  {
    label: 'True / False',
    value: QUIZ_QUESTION_TYPES.trueFalse,
    description: 'Binary answer using fixed true and false options.',
  },
  {
    label: 'Short Answer',
    value: QUIZ_QUESTION_TYPES.shortAnswer,
    description: 'Teacher reviews a brief written answer.',
  },
  {
    label: 'Essay',
    value: QUIZ_QUESTION_TYPES.essay,
    description: 'Teacher manually grades a long-form response.',
  },
];

export const getQuestionTypeLabel = (type: QuestionType): string => {
  switch (type) {
    case QUIZ_QUESTION_TYPES.singleMcq:
      return 'Single MCQ';
    case QUIZ_QUESTION_TYPES.multipleMcq:
      return 'Multiple MCQ';
    case QUIZ_QUESTION_TYPES.trueFalse:
      return 'True / False';
    case QUIZ_QUESTION_TYPES.shortAnswer:
      return 'Short Answer';
    case QUIZ_QUESTION_TYPES.essay:
      return 'Essay';
    default:
      return `Type ${type}`;
  }
};

export const questionTypeUsesOptions = (type: QuestionType): boolean =>
  type === QUIZ_QUESTION_TYPES.singleMcq ||
  type === QUIZ_QUESTION_TYPES.multipleMcq ||
  type === QUIZ_QUESTION_TYPES.trueFalse;

export const questionTypeNeedsManualGrading = (type: QuestionType): boolean =>
  type === QUIZ_QUESTION_TYPES.shortAnswer || type === QUIZ_QUESTION_TYPES.essay;

export const createEmptyQuestionOptions = (
  type: SupportedQuizQuestionType,
): QuestionOptionFormValue[] => {
  if (type === QUIZ_QUESTION_TYPES.trueFalse) {
    return [
      { text: 'True', isCorrect: true, orderIndex: 1 },
      { text: 'False', isCorrect: false, orderIndex: 2 },
    ];
  }

  if (questionTypeUsesOptions(type)) {
    return [
      { text: '', isCorrect: true, orderIndex: 1 },
      { text: '', isCorrect: false, orderIndex: 2 },
    ];
  }

  return [];
};

export const createEmptyQuestion = (orderIndex: number): QuestionEditorValues => ({
  text: '',
  type: QUIZ_QUESTION_TYPES.singleMcq,
  marks: 1,
  orderIndex,
  options: createEmptyQuestionOptions(QUIZ_QUESTION_TYPES.singleMcq),
});
