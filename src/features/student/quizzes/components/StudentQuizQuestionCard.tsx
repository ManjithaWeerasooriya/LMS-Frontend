'use client';

import { AlertTriangle } from 'lucide-react';

import type {
  StudentQuizAnswerDraft,
  StudentQuizQuestion,
} from '@/features/student/quizzes/api';
import { QuestionTypeBadge } from '@/features/teacher/quizzes/components/QuizShared';
import { QUIZ_QUESTION_TYPES } from '@/features/teacher/quizzes/types';
import { formatMarks } from '@/features/teacher/quizzes/utils';

type StudentQuizQuestionCardProps = {
  question: StudentQuizQuestion;
  questionNumber: number;
  value: StudentQuizAnswerDraft;
  readOnly: boolean;
  onChange: (nextValue: StudentQuizAnswerDraft) => void;
};

const baseInputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const renderSingleChoiceOptions = ({
  question,
  value,
  readOnly,
  onChange,
}: Omit<StudentQuizQuestionCardProps, 'questionNumber'>) => (
  <fieldset className="space-y-3">
    <legend className="sr-only">{question.text}</legend>
    {question.options.map((option) => {
      const checked = value.selectedOptionIds.includes(option.id);

      return (
        <label
          key={option.id}
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
            checked
              ? 'border-blue-200 bg-blue-50 text-slate-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          } ${readOnly ? 'cursor-default opacity-80' : ''}`}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={checked}
            disabled={readOnly}
            onChange={() =>
              onChange({
                ...value,
                selectedOptionIds: [option.id],
              })
            }
            className="mt-1 h-4 w-4 border-slate-300 text-[#1B3B8B] focus:ring-[#1B3B8B]"
          />
          <span>{option.text}</span>
        </label>
      );
    })}
  </fieldset>
);

const renderMultipleChoiceOptions = ({
  question,
  value,
  readOnly,
  onChange,
}: Omit<StudentQuizQuestionCardProps, 'questionNumber'>) => (
  <fieldset className="space-y-3">
    <legend className="sr-only">{question.text}</legend>
    {question.options.map((option) => {
      const checked = value.selectedOptionIds.includes(option.id);

      return (
        <label
          key={option.id}
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
            checked
              ? 'border-blue-200 bg-blue-50 text-slate-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          } ${readOnly ? 'cursor-default opacity-80' : ''}`}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={readOnly}
            onChange={() =>
              onChange({
                ...value,
                selectedOptionIds: checked
                  ? value.selectedOptionIds.filter((selectedId) => selectedId !== option.id)
                  : [...value.selectedOptionIds, option.id],
              })
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1B3B8B] focus:ring-[#1B3B8B]"
          />
          <span>{option.text}</span>
        </label>
      );
    })}
  </fieldset>
);

const renderTextAnswer = ({
  question,
  value,
  readOnly,
  onChange,
  rows,
  placeholder,
}: Omit<StudentQuizQuestionCardProps, 'questionNumber'> & {
  rows: number;
  placeholder: string;
}) => (
  <label className="block">
    <span className="sr-only">{question.text}</span>
    <textarea
      rows={rows}
      value={value.answerText}
      disabled={readOnly}
      onChange={(event) =>
        onChange({
          ...value,
          answerText: event.target.value,
        })
      }
      placeholder={placeholder}
      className={baseInputClassName}
    />
  </label>
);

export function StudentQuizQuestionCard({
  question,
  questionNumber,
  value,
  readOnly,
  onChange,
}: StudentQuizQuestionCardProps) {
  const hasSelectableOptions =
    question.type === QUIZ_QUESTION_TYPES.singleMcq ||
    question.type === QUIZ_QUESTION_TYPES.multipleMcq ||
    question.type === QUIZ_QUESTION_TYPES.trueFalse;

  return (
    <article
      id={`question-${question.id}`}
      className="scroll-mt-28 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
            Question {questionNumber}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{question.text}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuestionTypeBadge type={question.type} />
          {question.marks != null ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatMarks(question.marks)} marks
            </span>
          ) : null}
        </div>
      </div>

      {question.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">{question.description}</p>
      ) : null}

      <div className="mt-5">
        {question.unsupported ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This question type is not supported by the current student frontend yet. You can
                still review the rest of the quiz and submit other answers.
              </p>
            </div>
          </div>
        ) : hasSelectableOptions && question.options.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This question did not include any answer options in the API response.
          </div>
        ) : question.type === QUIZ_QUESTION_TYPES.singleMcq ||
          question.type === QUIZ_QUESTION_TYPES.trueFalse ? (
          renderSingleChoiceOptions({ question, value, readOnly, onChange })
        ) : question.type === QUIZ_QUESTION_TYPES.multipleMcq ? (
          renderMultipleChoiceOptions({ question, value, readOnly, onChange })
        ) : question.type === QUIZ_QUESTION_TYPES.shortAnswer ? (
          renderTextAnswer({
            question,
            value,
            readOnly,
            onChange,
            rows: 4,
            placeholder: 'Write your answer here.',
          })
        ) : question.type === QUIZ_QUESTION_TYPES.essay ? (
          renderTextAnswer({
            question,
            value,
            readOnly,
            onChange,
            rows: 7,
            placeholder: 'Write your full response here.',
          })
        ) : null}
      </div>
    </article>
  );
}
