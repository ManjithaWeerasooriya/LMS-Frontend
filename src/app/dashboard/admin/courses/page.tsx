'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminCourseTable } from '@/app/dashboard/admin/_components/AdminCourseTable';
import { useConfirm } from '@/context/ConfirmContext';
import {
  AdminApiError,
  type AdminCourse,
  deleteCourseAdmin,
  disableCourseAdmin,
  getAdminCourses,
} from '@/lib/admin';

type ToastState = { type: 'success' | 'error'; message: string } | null;
type ActionState = { courseId: string; type: 'disable' | 'delete' } | null;

const pageSizeOptions = [10, 20, 50];
const statusOptions = ['', 'Active', 'Disabled', 'Archived'];

export default function AdminCoursesPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<AdminCourse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [actionState, setActionState] = useState<ActionState>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminCourses({
        pageNumber,
        pageSize,
        teacherId: teacherFilter.trim() || undefined,
        status: statusFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setItems(response.items);
      setTotalCount(response.totalCount);
      setPageNumber(response.pageNumber);
      setPageSize(response.pageSize);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Unable to load courses. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, teacherFilter, statusFilter, searchQuery]);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(totalCount / (pageSize || 1)));
  const startIndex = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(totalCount, pageNumber * pageSize);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageNumber(1);
    setSearchQuery(searchInput);
  };

  const handleDisableCourse = async (courseId: string) => {
    const approved = await confirm({
      title: 'Disable this course?',
      description: 'This will archive the course. It will no longer be active.',
      variant: 'warning',
      confirmText: 'Disable Course',
      cancelText: 'Cancel',
    });
    if (!approved) return;

    setActionState({ courseId, type: 'disable' });
    try {
      await disableCourseAdmin(courseId);
      setToast({ type: 'success', message: 'Course disabled successfully.' });
      await fetchCourses();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setToast({ type: 'error', message: err.message });
      } else {
        setToast({ type: 'error', message: 'Unable to disable course.' });
      }
    } finally {
      setActionState(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const approved = await confirm({
      title: 'Delete this course?',
      description: 'This action permanently deletes the course. This cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete Course',
      cancelText: 'Cancel',
    });
    if (!approved) return;

    setActionState({ courseId, type: 'delete' });
    try {
      await deleteCourseAdmin(courseId);
      setToast({ type: 'success', message: 'Course deleted successfully.' });
      await fetchCourses();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setToast({ type: 'error', message: err.message });
      } else {
        setToast({ type: 'error', message: 'Unable to delete course.' });
      }
    } finally {
      setActionState(null);
    }
  };

  const statusOptionsDisplay = useMemo(
    () =>
      statusOptions.map((option) => ({
        value: option,
        label: option || 'All Statuses',
      })),
    [],
  );

  return (
    <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Tutor Management</p>
          <h1 className="text-3xl font-semibold text-slate-900">Platform Courses</h1>
          <p className="text-sm text-slate-500">Review and moderate all courses on the platform.</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title or keyword"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pl-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </span>
            </form>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teacher ID
                <input
                  type="text"
                  value={teacherFilter}
                  onChange={(event) => {
                    setTeacherFilter(event.target.value);
                    setPageNumber(1);
                  }}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPageNumber(1);
                  }}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  {statusOptionsDisplay.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page Size
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPageNumber(1);
                  }}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        {toast ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <AdminCourseTable
          items={items}
          loading={isLoading}
          error={error}
          actionState={actionState}
          onDisableCourse={handleDisableCourse}
          onDeleteCourse={handleDeleteCourse}
        />

        <footer className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row">
          <div>
            <p className="font-semibold text-slate-900">
              Showing {items.length} of {totalCount} courses
            </p>
            <p className="text-xs text-slate-500">
              Records {startIndex}-{endIndex} · Page {pageNumber} of {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={pageNumber <= 1 || isLoading}
              className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))}
              disabled={pageNumber >= totalPages || isLoading}
              className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              Next
            </button>
          </div>
        </footer>
    </div>
  );
}
