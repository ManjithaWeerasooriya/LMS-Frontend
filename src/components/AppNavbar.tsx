'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useAuthSession } from '@/hooks/useAuthSession';
import { type UserRole } from '@/lib/auth';

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

const getDisplayName = (sessionName: string | null, firstName?: string | null, lastName?: string | null) => {
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim();
  return fullName || sessionName?.trim() || 'My Account';
};

const getInitials = (displayName: string) => {
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'MA';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
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
  const session = useAuthSession();
  const { profile } = useCurrentUserProfile();
  const userRole = session.role;
  const displayName = getDisplayName(session.name, profile?.firstName, profile?.lastName);
  const avatarInitials = getInitials(displayName);
  const profileImageUrl = profile?.profileImageUrl?.trim() || null;
  const showUser = Boolean(session.token && userRole);

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

          {showUser && userRole ? (
            <Link
              href={getUserHomeHref(userRole)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3B8B] text-xs font-bold text-white">
                  {avatarInitials}
                </span>
              )}
              <span className="hidden sm:inline">{displayName}</span>
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
