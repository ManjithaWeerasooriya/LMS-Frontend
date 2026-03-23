'use client';

import type { AdminCourseRecord } from '@/lib/admin';

type AdminCourseTableProps = {
  courses: AdminCourseRecord[];
  loading: boolean;
  error?: string | null;
  actionState: { courseId: string; type: 'disable' | 'delete' } | null;
  onDisableCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
};

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
  disabled: 'bg-amber-50 text-amber-700',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function AdminCourseTable({
  courses,
  loading,
  error,
  actionState,
  onDisableCourse,
  onDeleteCourse,
}: AdminCourseTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Course Title</th>
              <th className="px-6 py-3">Teacher</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Enrollments</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-center text-slate-500" colSpan={6}>
                  Loading courses…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-6 py-6 text-center text-rose-600" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-center text-slate-500" colSpan={6}>
                  No courses match the current filters.
                </td>
              </tr>
            ) : (
              courses.map((course) => {
                const normalizedStatus = course.status?.toLowerCase?.() ?? '';
                const pillClass = statusClasses[normalizedStatus] ?? 'bg-slate-100 text-slate-600';
                const disableBusy = actionState?.courseId === course.id && actionState.type === 'disable';
                const deleteBusy = actionState?.courseId === course.id && actionState.type === 'delete';
                const disableDisabled = normalizedStatus === 'disabled' || normalizedStatus === 'archived' || disableBusy;

                return (
                  <tr key={course.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{course.title}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{course.teacherName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${pillClass}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{course.enrollmentCount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-700">{formatDate(course.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={disableDisabled}
                          onClick={() => onDisableCourse(course.id)}
                          className="rounded-2xl border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {disableBusy ? 'Disabling…' : 'Disable'}
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => onDeleteCourse(course.id)}
                          className="rounded-2xl border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {deleteBusy ? 'Deleting…' : 'Delete'}
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
  );
}
