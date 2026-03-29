'use client';

import type { AdminQuizReportSummary } from '@/features/teacher/api/admin';

type AdminQuizReportProps = {
  report: AdminQuizReportSummary | null;
  loading: boolean;
  error?: string | null;
};

export function AdminQuizReport({ report, loading, error }: AdminQuizReportProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Quizzes</p>
          <h2 className="text-xl font-semibold text-slate-900">Quiz Performance</h2>
        </div>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {typeof report?.averageScore === 'number' ? `${report.averageScore.toFixed(1)}%` : '—'}
            </p>
          )}
        </article>
        <article className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pass Rate</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {typeof report?.passRate === 'number' ? `${report.passRate.toFixed(1)}%` : '—'}
            </p>
          )}
        </article>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-100">
        <div className="overflow-hidden rounded-3xl">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Performance Band</th>
                <th className="px-4 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={2}>
                    Loading quiz report…
                  </td>
                </tr>
              ) : !Array.isArray(report?.performanceBands) || report.performanceBands.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500" colSpan={2}>
                    No quiz analytics available.
                  </td>
                </tr>
              ) : (
                report.performanceBands.map((band) => (
                  <tr key={band.label} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">{band.label}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {typeof band.percentage === 'number' ? `${band.percentage.toFixed(1)}%` : '—'}
                    </td>
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
