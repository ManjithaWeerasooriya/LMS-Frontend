'use client';

import type { AdminCoursesReportResponse } from '@/features/teacher/api/admin';

type AdminCoursesReportProps = {
  report: AdminCoursesReportResponse | null;
  loading: boolean;
  error?: string | null;
};

export function AdminCoursesReport({ report, loading, error }: AdminCoursesReportProps) {
  const courses = report?.courses ?? [];
  const activeCount = courses.filter((item) => item.status?.toLowerCase?.() === 'active').length;
  const archivedCount = courses.filter((item) => item.status?.toLowerCase?.() === 'archived').length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Courses</p>
          <h2 className="text-xl font-semibold text-slate-900">Enrollment &amp; Completion</h2>
        </div>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active vs Archived</p>
          {loading ? (
            <div className="mt-3 h-6 w-32 animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <p className="mt-3 text-base font-semibold text-slate-900">
              {activeCount} Active · {archivedCount} Archived
            </p>
          )}
        </article>
        <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tracked Courses</p>
          {loading ? (
            <div className="mt-3 h-6 w-24 animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <p className="mt-3 text-base font-semibold text-slate-900">{courses.length}</p>
          )}
        </article>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={5}>
                    Loading report…
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={5}>
                    No course analytics are available.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.courseId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">{course.courseTitle}</td>
                    <td className="px-4 py-3 text-slate-700">{course.teacherName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{course.enrollmentCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {typeof course.completionRate === 'number'
                        ? `${course.completionRate.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{course.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
