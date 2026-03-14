'use client';

import { useEffect, useState } from 'react';

import {
  createCourse,
  updateCourse,
  type CreateCourseInput,
  type TeacherCourseDetail,
} from '@/lib/teacher';

export type CourseModalMode = 'create' | 'edit';

export type CreateCourseModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: CourseModalMode;
  initialCourse?: TeacherCourseDetail | null;
  onSaved?: () => void | Promise<void>;
};

const emptyForm: CreateCourseInput = {
  title: '',
  category: '',
  description: '',
  durationHours: 40,
  price: 49.99,
  maxStudents: 100,
  difficulty: '',
  prerequisites: '',
  status: 'Active',
};

export function CreateCourseModal({
  open,
  onClose,
  mode = 'create',
  initialCourse,
  onSaved,
}: CreateCourseModalProps) {
  const [form, setForm] = useState<CreateCourseInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialCourse) {
      setForm({
        title: initialCourse.title,
        category: initialCourse.category ?? '',
        description: initialCourse.description ?? '',
        durationHours: initialCourse.durationHours,
        price: initialCourse.price,
        maxStudents: initialCourse.maxStudents,
        difficulty: initialCourse.difficultyLevel ?? '',
        prerequisites: initialCourse.prerequisites ?? '',
        status: initialCourse.status,
      });
    } else if (mode === 'create') {
      setForm(emptyForm);
    }
  }, [open, mode, initialCourse]);

  if (!open) return null;

  const handleChange = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialCourse) {
        await updateCourse(initialCourse.id, form);
      } else {
        await createCourse(form);
      }
      if (onSaved) {
        await onSaved();
      }
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
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'edit'
                ? 'Update course details, pricing, and status.'
                : 'Set up course details, pricing, and capacity for your students.'}
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-title">
                Course Title
              </label>
              <input
                id="course-title"
                type="text"
                required
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter course title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-category">
                Category
              </label>
              <input
                id="course-category"
                type="text"
                value={form.category ?? ''}
                onChange={(event) => handleChange('category', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g., Grammar, Speaking"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="course-description">
              Course Description
            </label>
            <textarea
              id="course-description"
              rows={4}
              value={form.description ?? ''}
              onChange={(event) => handleChange('description', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter detailed course description"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-duration">
                Duration (hours)
              </label>
              <input
                id="course-duration"
                type="number"
                min={0}
                value={form.durationHours ?? ''}
                onChange={(event) =>
                  handleChange('durationHours', Number(event.target.value) || 0)
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-price">
                Price
              </label>
              <input
                id="course-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price ?? ''}
                onChange={(event) => handleChange('price', Number(event.target.value) || 0)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-max-students">
                Max Students
              </label>
              <input
                id="course-max-students"
                type="number"
                min={1}
                value={form.maxStudents ?? ''}
                onChange={(event) =>
                  handleChange('maxStudents', Number(event.target.value) || 1)
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-difficulty">
                Difficulty Level
              </label>
              <input
                id="course-difficulty"
                type="text"
                value={form.difficulty ?? ''}
                onChange={(event) => handleChange('difficulty', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Beginner / Intermediate / Advanced"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700" htmlFor="course-prerequisites">
              Prerequisites
            </label>
            <input
              id="course-prerequisites"
              type="text"
              value={form.prerequisites ?? ''}
              onChange={(event) => handleChange('prerequisites', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="List any prerequisites"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700" htmlFor="course-status">
                Status
              </label>
              <select
                id="course-status"
                value={form.status ?? 'Active'}
                onChange={(event) => handleChange('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              disabled={isSubmitting || !form.title.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting
                ? mode === 'edit'
                  ? 'Saving…'
                  : 'Creating…'
                : mode === 'edit'
                ? 'Save Changes'
                : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

