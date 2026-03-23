import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>Genuine English LMS</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="transition hover:text-slate-900">
            Home
          </Link>
          <Link href="/courses" className="transition hover:text-slate-900">
            Courses
          </Link>
          <Link href="/register" className="transition hover:text-slate-900">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
