'use client';

import { useMemo, useState } from 'react';
import { CirclePlus, GripVertical, Trash2 } from 'lucide-react';

import { questionEditorSchema } from '@/features/teacher/quizzes/schemas';
import {
  QUIZ_QUESTION_TYPES,
  createEmptyQuestion,
  createEmptyQuestionOptions,
  getQuestionTypeLabel,
  questionTypeUsesOptions,
  quizQuestionTypeOptions,
  type QuestionEditorValues,
  type QuestionOptionFormValue,
  type SupportedQuizQuestionType,
} from '@/features/teacher/quizzes/types';

type QuestionComposerProps = {
  initialValue?: QuestionEditorValues;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (value: QuestionEditorValues) => Promise<void> | void;
};

type FieldErrors = Partial<Record<keyof QuestionEditorValues | 'options', string>>;

const buildNextOptions = (type: SupportedQuizQuestionType): QuestionOptionFormValue[] =>
  createEmptyQuestionOptions(type);

export function QuizQuestionComposer({
  initialValue,
  mode = 'create',
  isSubmitting = false,
  onCancel,
  onSubmit,
}: QuestionComposerProps) {
  const [draft, setDraft] = useState<QuestionEditorValues>(() => initialValue ?? createEmptyQuestion(1));
  const [errors, setErrors] = useState<FieldErrors>({});

  const usesOptions = useMemo(() => questionTypeUsesOptions(draft.type), [draft.type]);

  const setField = <K extends keyof QuestionEditorValues>(key: K, value: QuestionEditorValues[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleTypeChange = (type: SupportedQuizQuestionType) => {
    setDraft((current) => ({
      ...current,
      type,
      options: questionTypeUsesOptions(type) ? buildNextOptions(type) : [],
    }));
    setErrors({});
  };

  const updateOption = (
    index: number,
    update: (option: QuestionOptionFormValue) => QuestionOptionFormValue,
  ) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? update(option) : option,
      ),
    }));
    setErrors((current) => ({ ...current, options: undefined }));
  };

  const handleCorrectChange = (index: number) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (current.type === QUIZ_QUESTION_TYPES.multipleMcq) {
          return optionIndex === index
            ? { ...option, isCorrect: !option.isCorrect }
            : option;
        }

        return { ...option, isCorrect: optionIndex === index };
      }),
    }));
    setErrors((current) => ({ ...current, options: undefined }));
  };

  const addOption = () => {
    setDraft((current) => ({
      ...current,
      options: [
        ...current.options,
        {
          text: '',
          isCorrect: false,
          orderIndex: current.options.length + 1,
        },
      ],
    }));
  };

  const removeOption = (index: number) => {
    setDraft((current) => ({
      ...current,
      options: current.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({
          ...option,
          orderIndex: optionIndex + 1,
        })),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parseResult = questionEditorSchema.safeParse(draft);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      setErrors({
        text: fieldErrors.text?.[0],
        type: fieldErrors.type?.[0],
        marks: fieldErrors.marks?.[0],
        orderIndex: fieldErrors.orderIndex?.[0],
        options: fieldErrors.options?.[0],
      });
      return;
    }

    await onSubmit(parseResult.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {mode === 'edit' ? 'Edit Question' : 'Add Question'}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {draft.text.trim() || getQuestionTypeLabel(draft.type)}
          </h3>
        </div>
        <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-400 md:flex">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px]">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700" htmlFor="question-text">
            Question text
          </label>
          <textarea
            id="question-text"
            rows={4}
            value={draft.text}
            onChange={(event) => setField('text', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Write the prompt students will answer."
          />
          {errors.text ? <p className="text-xs text-rose-600">{errors.text}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700" htmlFor="question-type">
            Question type
          </label>
          <select
            id="question-type"
            value={draft.type}
            onChange={(event) => handleTypeChange(Number(event.target.value) as SupportedQuizQuestionType)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {quizQuestionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {quizQuestionTypeOptions.find((option) => option.value === draft.type)?.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="question-marks">
              Marks
            </label>
            <input
              id="question-marks"
              type="number"
              min={0.01}
              step="0.01"
              value={draft.marks}
              onChange={(event) => setField('marks', Number(event.target.value) || 0)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors.marks ? <p className="text-xs text-rose-600">{errors.marks}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="question-order">
              Order
            </label>
            <input
              id="question-order"
              type="number"
              min={1}
              value={draft.orderIndex}
              onChange={(event) => setField('orderIndex', Number(event.target.value) || 1)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {usesOptions ? (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Answer options</p>
              <p className="text-xs text-slate-500">
                Mark the correct answer{draft.type === QUIZ_QUESTION_TYPES.multipleMcq ? 's' : ''}.
              </p>
            </div>
            {draft.type !== QUIZ_QUESTION_TYPES.trueFalse ? (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CirclePlus className="h-4 w-4" />
                Add Option
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {draft.options.map((option, index) => {
              const isTrueFalse = draft.type === QUIZ_QUESTION_TYPES.trueFalse;

              return (
                <div
                  key={`${option.orderIndex}-${index}`}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <button
                    type="button"
                    onClick={() => handleCorrectChange(index)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-semibold transition ${
                      option.isCorrect
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                    }`}
                    aria-label={`Mark option ${index + 1} as correct`}
                  >
                    {draft.type === QUIZ_QUESTION_TYPES.multipleMcq ? '✓' : `${index + 1}`}
                  </button>

                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) =>
                      updateOption(index, (current) => ({
                        ...current,
                        text: event.target.value,
                      }))
                    }
                    disabled={isTrueFalse}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    placeholder={`Option ${index + 1}`}
                  />

                  {draft.type !== QUIZ_QUESTION_TYPES.trueFalse ? (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
          {errors.options ? <p className="text-xs text-rose-600">{errors.options}</p> : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
          Students will submit a written answer. This question will appear in the manual grading
          queue after submission.
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
}
