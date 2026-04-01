export default function CourseDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <div className="space-y-8">
          <section className="animate-pulse rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex gap-3">
              <div className="h-7 w-24 rounded-full bg-slate-100" />
              <div className="h-7 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="mt-6 h-14 w-4/5 rounded-3xl bg-slate-200" />
            <div className="mt-4 h-7 w-3/4 rounded-2xl bg-slate-100" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-slate-100" />
              ))}
            </div>
          </section>

          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="animate-pulse rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="h-8 w-52 rounded-2xl bg-slate-200" />
              <div className="mt-5 h-24 rounded-2xl bg-slate-100" />
            </section>
          ))}
        </div>

        <aside className="animate-pulse rounded-[30px] border border-slate-200 bg-slate-900 p-6 shadow-sm">
          <div className="h-4 w-28 rounded-full bg-slate-700" />
          <div className="mt-4 h-10 w-40 rounded-2xl bg-slate-700" />
          <div className="mt-4 h-16 rounded-2xl bg-slate-800" />
          <div className="mt-6 h-28 rounded-[24px] bg-slate-800" />
          <div className="mt-6 h-12 rounded-2xl bg-slate-700" />
          <div className="mt-3 h-12 rounded-2xl bg-slate-800" />
          <div className="mt-6 h-32 rounded-[24px] bg-slate-800" />
        </aside>
      </div>
    </main>
  );
}
