'use client';

import { useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { manualGradeSchema } from '@/features/teacher/quizzes/schemas';
import { QuestionTypeBadge } from '@/features/teacher/quizzes/components/QuizShared';
import {
  questionTypeNeedsManualGrading,
  type TeacherQuizAttemptAnswer,
  type TeacherQuizAttemptDetail,
} from '@/features/teacher/quizzes/types';
import { formatMarks } from '@/features/teacher/quizzes/utils';

type ManualGradeDraft = {
  awardedMarks: number;
  teacherFeedback: string;
};

type QuizAttemptReviewProps = {
  attempt: TeacherQuizAttemptDetail;
  savingAnswerId?: string | null;
  error?: string | null;
  onGradeAnswer: (answerId: string, value: ManualGradeDraft) => Promise<void>;
};

type AnswerErrors = Record<string, string | undefined>;

const toInitialDraft = (answer: TeacherQuizAttemptAnswer): ManualGradeDraft => ({
  awardedMarks: answer.awardedMarks ?? 0,
  teacherFeedback: answer.teacherFeedback,
});

export function QuizAttemptReview({
  attempt,
  savingAnswerId,
  error,
  onGradeAnswer,
}: QuizAttemptReviewProps) {
  const [drafts, setDrafts] = useState<Record<string, ManualGradeDraft>>(() =>
    Object.fromEntries(attempt.answers.map((answer) => [answer.id, toInitialDraft(answer)])),
  );
  const [draftErrors, setDraftErrors] = useState<AnswerErrors>({});

  const updateDraft = (
    answerId: string,
    update: (current: ManualGradeDraft) => ManualGradeDraft,
  ) => {
    setDrafts((current) => ({
      ...current,
      [answerId]: update(current[answerId] ?? { awardedMarks: 0, teacherFeedback: '' }),
    }));
    setDraftErrors((current) => ({ ...current, [answerId]: undefined }));
  };

  const handleGradeSubmit = async (answer: TeacherQuizAttemptAnswer) => {
    const draft = drafts[answer.id] ?? toInitialDraft(answer);
    const parseResult = manualGradeSchema.safeParse(draft);

    if (!parseResult.success) {
      setDraftErrors((current) => ({
        ...current,
        [answer.id]:
          parseResult.error.flatten().fieldErrors.awardedMarks?.[0] ??
          parseResult.error.flatten().fieldErrors.teacherFeedback?.[0] ??
          'Enter a valid score.',
      }));
      return;
    }

    await onGradeAnswer(answer.id, {
      awardedMarks: parseResult.data.awardedMarks,
      teacherFeedback: parseResult.data.teacherFeedback ?? '',
    });
  };

  return (
    <div className="space-y-4">
      <ErrorAlert message={error ?? ''} />

      {attempt.answers.map((answer, index) => {
        const needsManualGrading = questionTypeNeedsManualGrading(answer.questionType);
        const draft = drafts[answer.id] ?? toInitialDraft(answer);

        return (
          <article
            key={answer.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    Q{index + 1}
                  </span>
                  <QuestionTypeBadge type={answer.questionType} />
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {formatMarks(answer.maxMarks)} marks
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{answer.questionText}</h3>
              </div>

              {!needsManualGrading ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    answer.isCorrect
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {answer.isCorrect ? 'Auto graded correct' : 'Auto graded'}
                </span>
              ) : (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    answer.needsManualGrading
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {answer.needsManualGrading ? 'Needs manual grading' : 'Manual grade saved'}
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                {answer.selectedOptionTexts.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Student answer
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {answer.selectedOptionTexts.map((option) => (
                        <span
                          key={option}
                          className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Student answer
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {answer.answerText || 'No answer text submitted.'}
                    </div>
                  </div>
                )}

                {answer.options.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Question options
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {answer.options.map((option) => (
                        <div
                          key={option.id}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            option.isCorrect
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <p className="font-medium">{option.text}</p>
                          <p className="mt-1 text-xs">
                            {option.isCorrect ? 'Correct option' : 'Option'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Grading
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Current score: {formatMarks(answer.awardedMarks ?? 0)} /{' '}
                      {formatMarks(answer.maxMarks)}
                    </p>
                  </div>

                  {needsManualGrading ? (
                    <>
                      <div className="space-y-2">
                        <label
                          className="text-xs font-semibold text-slate-700"
                          htmlFor={`marks-${answer.id}`}
                        >
                          Awarded marks
                        </label>
                        <input
                          id={`marks-${answer.id}`}
                          type="number"
                          min={0}
                          max={answer.maxMarks || undefined}
                          step="0.01"
                          value={draft.awardedMarks}
                          onChange={(event) =>
                            updateDraft(answer.id, (current) => ({
                              ...current,
                              awardedMarks: Number(event.target.value) || 0,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-xs font-semibold text-slate-700"
                          htmlFor={`feedback-${answer.id}`}
                        >
                          Teacher feedback
                        </label>
                        <textarea
                          id={`feedback-${answer.id}`}
                          rows={5}
                          value={draft.teacherFeedback}
                          onChange={(event) =>
                            updateDraft(answer.id, (current) => ({
                              ...current,
                              teacherFeedback: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Add private feedback for the student."
                        />
                      </div>

                      {draftErrors[answer.id] ? (
                        <p className="text-xs text-rose-600">{draftErrors[answer.id]}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleGradeSubmit(answer)}
                        disabled={savingAnswerId === answer.id}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {savingAnswerId === answer.id ? 'Saving…' : 'Save Grade'}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      This answer was graded automatically. Manual grading is only required for
                      short answer and essay questions.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </article>
        );
      })}
    </div>
  );
}
