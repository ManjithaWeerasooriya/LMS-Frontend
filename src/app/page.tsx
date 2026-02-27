import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Welcome to</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Learning Management System</h1>
        <p className="mt-4 text-base text-slate-500">
          Streamline Genuine English sessions with Isuru Samarakoon. Sign in to manage lessons, assignments, and
          progress under one platform.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
