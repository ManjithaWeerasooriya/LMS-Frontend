import { z } from 'zod';

import {
  QUIZ_QUESTION_TYPES,
  createEmptyQuestionOptions,
  questionTypeUsesOptions,
  type QuestionEditorValues,
  type QuizEditorValues,
  type SupportedQuizQuestionType,
} from '@/features/teacher/quizzes/types';

const supportedQuestionTypeSchema = z.union([
  z.literal(QUIZ_QUESTION_TYPES.singleMcq),
  z.literal(QUIZ_QUESTION_TYPES.multipleMcq),
  z.literal(QUIZ_QUESTION_TYPES.trueFalse),
  z.literal(QUIZ_QUESTION_TYPES.shortAnswer),
  z.literal(QUIZ_QUESTION_TYPES.essay),
]);

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, 'Option text is required.').max(1000),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().min(1),
});

export const quizEditorSchema = z
  .object({
    title: z.string().trim().min(1, 'Quiz title is required.').max(200),
    description: z.string().trim().max(4000),
    durationMinutes: z.number().int().min(1).max(500),
    totalMarks: z.number().min(0.01).max(999999),
    startTimeLocal: z.string().trim(),
    endTimeLocal: z.string().trim(),
    randomizeQuestions: z.boolean(),
    allowMultipleAttempts: z.boolean(),
    isPublished: z.boolean(),
    areResultsPublished: z.boolean(),
  })
  .superRefine((value, context) => {
    const hasStart = Boolean(value.startTimeLocal);
    const hasEnd = Boolean(value.endTimeLocal);

    if (hasStart !== hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasStart ? ['endTimeLocal'] : ['startTimeLocal'],
        message: 'Set both a start and end time, or leave both empty.',
      });
      return;
    }

    if (hasStart && hasEnd) {
      const start = new Date(value.startTimeLocal);
      const end = new Date(value.endTimeLocal);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startTimeLocal'],
          message: 'Enter valid dates and times.',
        });
        return;
      }

      if (end <= start) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTimeLocal'],
          message: 'End time must be later than start time.',
        });
      }
    }
  });

export const questionEditorSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().trim().min(1, 'Question text is required.').max(4000),
    type: supportedQuestionTypeSchema,
    marks: z.number().min(0.01).max(999999),
    orderIndex: z.number().int().min(1),
    options: z.array(optionSchema),
  })
  .superRefine((value, context) => {
    const usesOptions = questionTypeUsesOptions(value.type);
    const trimmedOptions = value.options.map((option) => ({
      ...option,
      text: option.text.trim(),
    }));

    if (!usesOptions) {
      if (trimmedOptions.length > 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'This question type does not use answer options.',
        });
      }
      return;
    }

    if (trimmedOptions.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Add at least two options.',
      });
    }

    const correctOptions = trimmedOptions.filter((option) => option.isCorrect);

    if (value.type === QUIZ_QUESTION_TYPES.singleMcq && correctOptions.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Single MCQ questions must have exactly one correct option.',
      });
    }

    if (value.type === QUIZ_QUESTION_TYPES.multipleMcq && correctOptions.length < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Multiple MCQ questions need at least one correct option.',
      });
    }

    if (value.type === QUIZ_QUESTION_TYPES.trueFalse) {
      if (trimmedOptions.length !== 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'True / False questions must keep exactly two options.',
        });
      }

      if (correctOptions.length !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'True / False questions must have exactly one correct answer.',
        });
      }
    }
  });

export const manualGradeSchema = z.object({
  awardedMarks: z.number().min(0).max(999999),
  teacherFeedback: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const defaultQuizEditorValues: QuizEditorValues = {
  title: '',
  description: '',
  durationMinutes: 30,
  totalMarks: 100,
  startTimeLocal: '',
  endTimeLocal: '',
  randomizeQuestions: false,
  allowMultipleAttempts: false,
  isPublished: false,
  areResultsPublished: false,
};

export const createQuestionDraft = (
  orderIndex: number,
  type: SupportedQuizQuestionType = QUIZ_QUESTION_TYPES.singleMcq,
): QuestionEditorValues => ({
  text: '',
  type,
  marks: 1,
  orderIndex,
  options: createEmptyQuestionOptions(type),
});
