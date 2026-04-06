'use client';

import { useMemo, useState } from 'react';
import { PencilLine, Plus, Trash2 } from 'lucide-react';

import { QuizQuestionComposer } from '@/features/teacher/quizzes/components/QuizQuestionComposer';
import { QuestionTypeBadge, QuizStatePanel } from '@/features/teacher/quizzes/components/QuizShared';
import type {
  QuestionEditorValues,
  TeacherQuizQuestion,
} from '@/features/teacher/quizzes/types';
import { formatMarks } from '@/features/teacher/quizzes/utils';

type QuizQuestionsManagerProps = {
  questions: TeacherQuizQuestion[];
  isLoading?: boolean;
  isAdding?: boolean;
  savingQuestionId?: string | null;
  deletingQuestionId?: string | null;
  onAddQuestion: (value: QuestionEditorValues) => Promise<void>;
  onUpdateQuestion: (questionId: string, value: QuestionEditorValues) => Promise<void>;
  onDeleteQuestion: (question: TeacherQuizQuestion) => void;
};

const mapQuestionToEditor = (question: TeacherQuizQuestion): QuestionEditorValues => ({
  id: question.id,
  text: question.text,
  type: question.type as QuestionEditorValues['type'],
  marks: question.marks,
  orderIndex: question.orderIndex,
  options: question.options.map((option) => ({
    id: option.id,
    text: option.text,
    isCorrect: option.isCorrect,
    orderIndex: option.orderIndex,
  })),
});

export function QuizQuestionsManager({
  questions,
  isLoading = false,
  isAdding = false,
  savingQuestionId,
  deletingQuestionId,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: QuizQuestionsManagerProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const sortedQuestions = useMemo(
    () => [...questions].sort((left, right) => left.orderIndex - right.orderIndex),
    [questions],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Question bank</h3>
          <p className="text-sm text-slate-500">
            Add, edit, and remove quiz questions one by one using the teacher quiz endpoints.
          </p>
        </div>
        {!isComposerOpen ? (
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        ) : null}
      </div>

      {isComposerOpen ? (
        <QuizQuestionComposer
          key={`new-question-${sortedQuestions.length + 1}`}
          mode="create"
          initialValue={{
            text: '',
            type: 1,
            marks: 1,
            orderIndex: sortedQuestions.length + 1,
            options: [
              { text: '', isCorrect: true, orderIndex: 1 },
              { text: '', isCorrect: false, orderIndex: 2 },
            ],
          }}
          isSubmitting={isAdding}
          onCancel={() => setIsComposerOpen(false)}
          onSubmit={async (value) => {
            await onAddQuestion(value);
            setIsComposerOpen(false);
          }}
        />
      ) : null}

      {isLoading ? (
        <QuizStatePanel
          title="Loading questions"
          message="Fetching the latest question set for this quiz."
        />
      ) : sortedQuestions.length === 0 ? (
        <QuizStatePanel
          title="No questions yet"
          message="Create your first question to start building the assessment."
        />
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((question) => {
            const isEditing = editingQuestionId === question.id;
            const isSaving = savingQuestionId === question.id;
            const editorValue = mapQuestionToEditor(question);

            return (
              <article
                key={question.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                {isEditing ? (
                  <QuizQuestionComposer
                    key={`edit-question-${question.id}`}
                    mode="edit"
                    initialValue={editorValue}
                    isSubmitting={isSaving}
                    onCancel={() => setEditingQuestionId(null)}
                    onSubmit={async (value) => {
                      await onUpdateQuestion(question.id, value);
                      setEditingQuestionId(null);
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                            Q{question.orderIndex}
                          </span>
                          <QuestionTypeBadge type={question.type} />
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                            {formatMarks(question.marks)} marks
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">{question.text}</h4>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingQuestionId(question.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(question)}
                          disabled={deletingQuestionId === question.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingQuestionId === question.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    {question.options.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {question.options.map((option) => (
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
                              {option.isCorrect ? 'Correct option' : 'Distractor option'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Students will answer this question in free text and it can be manually
                        graded later.
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
