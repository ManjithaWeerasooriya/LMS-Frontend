import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/register', label: 'Register' },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Genuine English
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-xl border border-blue-200 px-3 py-2 text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
