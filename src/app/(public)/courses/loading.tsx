export default function CoursesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="animate-pulse rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="mt-5 h-12 max-w-2xl rounded-2xl bg-slate-200" />
        <div className="mt-4 h-6 max-w-3xl rounded-2xl bg-slate-100" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
      </section>

      <section className="mt-8 animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-14 rounded-2xl bg-slate-100 lg:col-span-1" />
          <div className="h-14 rounded-2xl bg-slate-100" />
          <div className="h-14 rounded-2xl bg-slate-100" />
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-6 w-24 rounded-full bg-slate-100" />
            <div className="mt-6 h-8 w-3/4 rounded-2xl bg-slate-200" />
            <div className="mt-4 h-20 rounded-2xl bg-slate-100" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
            </div>
            <div className="mt-6 h-12 rounded-2xl bg-slate-200" />
          </div>
        ))}
      </section>
    </main>
  );
}
