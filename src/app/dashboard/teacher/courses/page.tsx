'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';

import { useConfirm } from '@/context/ConfirmContext';
import {
  deleteCourse,
  getTeacherCourseById,
  getTeacherCourses,
  type TeacherCourse,
  type TeacherCourseDetail,
} from '@/lib/teacher';
import { CreateCourseModal } from '../_components/CreateCourseModal';

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TeacherCourseDetail | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const data = await getTeacherCourses();
        if (!isMounted) return;
        setCourses(data);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const term = search.toLowerCase();
    return courses.filter((course) => {
      const category = course.category ?? '';
      return (
        course.title.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term)
      );
    });
  }, [courses, search]);

  const handleModalClose = () => {
    setOpenCreateModal(false);
  };

  const reloadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await getTeacherCourses();
      setCourses(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      const detail = await getTeacherCourseById(id);
      setEditCourse(detail);
      setEditModalOpen(true);
    } catch {
      // Could add a toast or error state here.
    }
  };

  const handleDeleteClick = async (id: string) => {
    const approved = await confirm({
      title: 'Delete this course?',
      description:
        'This action cannot be undone. Existing enrollments will lose access to this course content.',
      variant: 'danger',
      confirmText: 'Delete Course',
      cancelText: 'Cancel',
    });

    if (!approved) return;

    await deleteCourse(id);
    await reloadCourses();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">
            Courses
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">My Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your course catalog, pricing, and enrollment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenCreateModal(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
        >
          + Create Course
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses by title or category..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pl-10 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Filters
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Course Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Students</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      Loading courses…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((course) => {
                    const statusLabel = course.status;
                    const statusClass =
                      course.status.toLowerCase() === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : course.status.toLowerCase() === 'draft'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600';

                    return (
                      <tr key={course.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {course.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {course.students} students enrolled
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {course.category ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {course.students}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          Rs: {course.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {course.rating != null ? `⭐ ${course.rating.toFixed(1)}` : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-slate-500">
                            <button
                              type="button"
                              onClick={() => handleEditClick(course.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition transform hover:bg-slate-200 hover:scale-105"
                              aria-label="Edit course"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(course.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-2xl text-slate-700 transition transform hover:scale-105"
                              aria-label="Delete course"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CreateCourseModal
        open={openCreateModal}
        onClose={handleModalClose}
        mode="create"
        onSaved={reloadCourses}
      />
      <CreateCourseModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        mode="edit"
        initialCourse={editCourse ?? undefined}
        onSaved={reloadCourses}
      />
    </div>
  );
}

