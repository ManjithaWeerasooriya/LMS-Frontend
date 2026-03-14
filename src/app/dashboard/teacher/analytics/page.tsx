'use client';

export default function TeacherAnalyticsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Analytics</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visualize student performance, course completion, and engagement metrics. The main
          dashboard already shows key charts; more detailed analytics can be added here later.
        </p>
      </header>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Detailed analytics views are coming soon. For now, use the Instructor Dashboard overview
        charts to monitor performance.
      </section>
    </div>
  );
}

