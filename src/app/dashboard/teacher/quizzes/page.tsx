'use client';

import { useEffect, useState } from 'react';

import {
  getTeacherQuizzes,
  type TeacherQuiz,
} from '@/lib/teacher';
import { CreateQuizModal } from '../_components/CreateQuizModal';

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuizzes = async () => {
      try {
        const data = await getTeacherQuizzes();
        if (!isMounted) return;
        setQuizzes(data);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadQuizzes();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleModalClose = () => {
    setOpenCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">
            Quizzes &amp; Assessments
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Quizzes &amp; Assessments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage quizzes for your courses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenCreateModal(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
        >
          + Create Quiz
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading quizzes…</p>
        ) : quizzes.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            You haven&apos;t created any quizzes yet. Use the &quot;Create Quiz&quot; button to get
            started.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <article
                key={quiz.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                      {quiz.questionCount} Questions
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {quiz.durationMinutes} min
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {quiz.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">{quiz.courseTitle}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
                        Attempts
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {quiz.attempts}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2">
                      <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
                        Avg Score
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {quiz.averageScorePercent}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#17306f]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#1B3B8B] px-4 py-2 text-xs font-semibold text-[#1B3B8B] transition hover:bg-blue-50"
                  >
                    Results
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <CreateQuizModal open={openCreateModal} onClose={handleModalClose} />
    </div>
  );
}
