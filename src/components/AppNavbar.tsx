'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import {
  AUTH_STATE_CHANGE_EVENT,
  getStoredAuthSession,
  type UserRole,
} from '@/lib/auth';

type NavbarLink = {
  href: string;
  label: string;
};

type AppNavbarProps = {
  leading?: ReactNode;
  actions?: ReactNode;
  links?: NavbarLink[];
  contentClassName?: string;
};

type NavbarUser = {
  name: string;
  role: UserRole;
};

const defaultLinks: NavbarLink[] = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
];

const isActiveLink = (pathname: string, href: string) => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const getUserHomeHref = (role: UserRole) => {
  if (role === 'Student') {
    return '/student/dashboard/settings';
  }

  return '/teacher/dashboard/settings';
};

export function AppNavbar({
  leading,
  actions,
  links = defaultLinks,
  contentClassName = 'mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8',
}: AppNavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<NavbarUser | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const session = getStoredAuthSession();
      const role = session.role;
      const name = session.name;

      if (!session.token || !role || !name) {
        setUser(null);
        return;
      }

      setUser({ name, role });
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncUser);
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className={contentClassName}>
        <div className="flex items-center gap-4">
          {leading ? <div className="shrink-0">{leading}</div> : null}

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1B3B8B] text-white">
              <span className="text-lg font-semibold">GE</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">Genuine English</p>
              <p className="text-xs text-slate-500">Learning Platform</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <Link
              href={getUserHomeHref(user.role)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white"
            >
              {user.name}
            </Link>
          ) : actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-[#1B3B8B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#17306f]"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
