'use client';

export default function TeacherMaterialsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Materials</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Course Materials</h1>
        <p className="mt-1 text-sm text-slate-500">
          Organize lesson files, worksheets, and reference documents for your courses. This page is
          currently a placeholder and can be wired to a materials API later.
        </p>
      </header>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Material management is coming soon. You can still upload and share resources through your
        existing course tools for now.
      </section>
    </div>
  );
}
