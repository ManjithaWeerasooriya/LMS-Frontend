'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorAlert } from '@/components/ErrorAlert';
import { defaultQuizEditorValues, quizEditorSchema } from '@/features/teacher/quizzes/schemas';
import type { QuizEditorValues } from '@/features/teacher/quizzes/types';

type QuizDetailsFormProps = {
  initialValues?: QuizEditorValues;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: QuizEditorValues) => Promise<void> | void;
};

export function QuizDetailsForm({
  initialValues,
  mode,
  isSubmitting = false,
  error,
  onSubmit,
}: QuizDetailsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuizEditorValues>({
    resolver: zodResolver(quizEditorSchema),
    defaultValues: initialValues ?? defaultQuizEditorValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultQuizEditorValues);
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-6">
      <ErrorAlert message={error ?? ''} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Quiz details</h2>
              <p className="text-sm text-slate-500">
                Set the title, instructions, timing, and score settings for this assessment.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-title">
                  Title
                </label>
                <input
                  id="quiz-title"
                  type="text"
                  {...register('title')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Week 4 Reading Checkpoint"
                />
                {errors.title ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-description">
                  Description
                </label>
                <textarea
                  id="quiz-description"
                  rows={5}
                  {...register('description')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Explain what the quiz covers and any instructions students should read first."
                />
                {errors.description ? (
                  <p className="text-xs text-rose-600">{errors.description.message}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-duration">
                    Duration (minutes)
                  </label>
                  <input
                    id="quiz-duration"
                    type="number"
                    min={1}
                    max={500}
                    {...register('durationMinutes', { valueAsNumber: true })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.durationMinutes ? (
                    <p className="text-xs text-rose-600">{errors.durationMinutes.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-total-marks">
                    Total marks
                  </label>
                  <input
                    id="quiz-total-marks"
                    type="number"
                    min={0.01}
                    step="0.01"
                    {...register('totalMarks', { valueAsNumber: true })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.totalMarks ? (
                    <p className="text-xs text-rose-600">{errors.totalMarks.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
              <p className="text-sm text-slate-500">
                Schedule a visible quiz window or leave it open-ended for manual release.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-start">
                  Start time
                </label>
                <input
                  id="quiz-start"
                  type="datetime-local"
                  {...register('startTimeLocal')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {errors.startTimeLocal ? (
                  <p className="text-xs text-rose-600">{errors.startTimeLocal.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-end">
                  End time
                </label>
                <input
                  id="quiz-end"
                  type="datetime-local"
                  {...register('endTimeLocal')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {errors.endTimeLocal ? (
                  <p className="text-xs text-rose-600">{errors.endTimeLocal.message}</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
            <div className="mt-5 space-y-4">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  {...register('randomizeQuestions')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Randomize question order
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Shuffle questions when the quiz opens.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  {...register('allowMultipleAttempts')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Allow multiple attempts
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Let students re-open the quiz according to backend rules.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  {...register('isPublished')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Publish quiz</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Make the quiz available to students when the schedule permits.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  {...register('areResultsPublished')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Publish results
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Show scores and released feedback to students.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-[#0f172a] p-5 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Workflow
            </p>
            <h2 className="mt-3 text-lg font-semibold">
              {mode === 'create' ? 'Create first, then add questions' : 'Questions live below'}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {mode === 'create'
                ? 'The backend creates quizzes and questions through separate endpoints. Save the quiz first, then continue in the editor to add question sets.'
                : 'After saving settings, use the question manager section to add, edit, delete, and order question items.'}
            </p>
          </section>
        </aside>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create Quiz' : 'Save Quiz'}
        </button>
      </div>
    </form>
  );
}
