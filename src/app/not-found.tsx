import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-4 text-base text-slate-500">
        The page you requested does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-[#2F4EA2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#243b7a]"
        >
          Back to Home
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 px-6 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
        >
          Browse Courses
        </Link>
      </div>
    </main>
  );
}
