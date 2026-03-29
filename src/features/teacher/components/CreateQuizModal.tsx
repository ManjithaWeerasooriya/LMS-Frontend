'use client';

import { useEffect, useState } from 'react';

import {
  createQuiz,
  getTeacherCourses,
  type CreateQuizInput,
  type TeacherCourse,
} from '@/features/teacher/api/teacher';

export type CreateQuizModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateQuizModal({ open, onClose }: CreateQuizModalProps) {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [form, setForm] = useState<CreateQuizInput>({
    title: '',
    courseId: '',
    durationMinutes: 30,
    totalMarks: 100,
    passingMarks: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const loadCourses = async () => {
      try {
        const allCourses = await getTeacherCourses();
        if (!isMounted) return;
        setCourses(allCourses);
        if (!form.courseId && allCourses[0]) {
          setForm((prev) => ({ ...prev, courseId: allCourses[0].id }));
        }
      } catch {
        // Ignore for now. The form falls back to a free-text course field.
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, [open, form.courseId]);

  if (!open) return null;

  const handleChange = <K extends keyof CreateQuizInput>(key: K, value: CreateQuizInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.courseId) return;

    setIsSubmitting(true);
    try {
      await createQuiz(form);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const canSubmit =
    form.title.trim() &&
    form.courseId &&
    form.durationMinutes > 0 &&
    form.totalMarks > 0 &&
    form.passingMarks > 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create New Quiz</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure quiz details, timing, and passing criteria for your course.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-title">
              Quiz Title
            </label>
            <input
              id="quiz-title"
              type="text"
              required
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter quiz title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-course">
              Course
            </label>
            {courses.length > 0 ? (
              <select
                id="quiz-course"
                value={form.courseId}
                onChange={(event) => handleChange('courseId', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="quiz-course"
                type="text"
                value={form.courseId}
                onChange={(event) => handleChange('courseId', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter course name"
              />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-duration">
                Duration (minutes)
              </label>
              <input
                id="quiz-duration"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(event) =>
                  handleChange('durationMinutes', Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-total-marks">
                Total Marks
              </label>
              <input
                id="quiz-total-marks"
                type="number"
                min={1}
                value={form.totalMarks}
                onChange={(event) =>
                  handleChange('totalMarks', Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="quiz-passing-marks">
                Passing Marks
              </label>
              <input
                id="quiz-passing-marks"
                type="number"
                min={1}
                value={form.passingMarks}
                onChange={(event) =>
                  handleChange('passingMarks', Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Questions
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Question authoring will be added once backend quiz endpoints are ready. For now, you
              can create quiz shells linked to your courses.
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Creating…' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
