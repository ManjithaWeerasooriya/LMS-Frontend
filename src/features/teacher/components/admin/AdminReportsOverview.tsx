'use client';

import type { AdminOverviewReport } from '@/features/teacher/api/admin';

type AdminReportsOverviewProps = {
  data: AdminOverviewReport | null;
  loading: boolean;
  error?: string | null;
};

const placeholders = [
  { label: 'Total Users', key: 'totalUsers' as const },
  { label: 'Total Courses', key: 'totalCourses' as const },
  { label: 'Total Enrollments', key: 'totalEnrollments' as const },
  { label: 'Completion Rate', key: 'completionRate' as const },
];

export function AdminReportsOverview({ data, loading, error }: AdminReportsOverviewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Overview</p>
          <h2 className="text-xl font-semibold text-slate-900">System Summary</h2>
        </div>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((metric) => {
          const value = data ? (data as Record<string, unknown>)[metric.key] : null;
          const formatted =
            metric.key === 'completionRate' && typeof value === 'number'
              ? `${value.toFixed(1)}%`
              : typeof value === 'number'
                ? value.toLocaleString()
                : '—';

          return (
            <article
              key={metric.key}
              className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              {loading ? (
                <div className="mt-3 h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
              ) : (
                <p className="mt-3 text-2xl font-semibold text-slate-900">{formatted}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
