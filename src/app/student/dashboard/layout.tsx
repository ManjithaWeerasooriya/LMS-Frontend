'use client';

import Link from 'next/link';
import { BarChart3, LogOut, Menu, PanelLeftClose, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useConfirm } from '@/context/ConfirmContext';
import {
  decodeJwt,
  getStoredAuthToken,
  getStoredUserRole,
  logoutUser,
  type DecodedJwt,
} from '@/lib/auth';

type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: BarChart3 },
];

const getRoleClaim = (payload: DecodedJwt | null): string | undefined => {
  if (!payload) return undefined;
  const roleKeys = ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  for (const key of roleKeys) {
    const value = payload[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const getDisplayName = (payload: DecodedJwt | null): string => {
  if (!payload) return 'Student';
  const keys = [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    'name',
    'unique_name',
    'email',
    'sub',
  ];

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return 'Student';
};

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const [isMobileSidebarExpanded, setIsMobileSidebarExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const enforceStudentAccess = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        await logoutUser();
        if (!cancelled) {
          setIsChecking(false);
        }
        router.replace('/login');
        return;
      }

      const payload = decodeJwt(token);
      const expMs = typeof payload?.exp === 'number' ? payload.exp * 1000 : 0;

      if (!payload || !expMs || expMs < Date.now()) {
        await logoutUser();
        if (!cancelled) {
          setIsChecking(false);
        }
        router.replace('/login');
        return;
      }

      const roleFromToken = getRoleClaim(payload)?.toLowerCase();
      const storedRole = getStoredUserRole();
      const hasStudentRole = roleFromToken === 'student' || storedRole === 'Student';

      if (!hasStudentRole) {
        if (!cancelled) {
          setIsChecking(false);
        }

        if (storedRole === 'Instructor' || storedRole === 'Admin') {
          router.replace('/teacher/dashboard');
        } else {
          router.replace('/login');
        }
        return;
      }

      if (!cancelled) {
        setStudentName(getDisplayName(payload));
        setIsAuthorized(true);
        setIsChecking(false);
      }
    };

    void enforceStudentAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    const approved = await confirm({
      title: 'Log out of LMS?',
      description: 'You will need to sign in again to continue learning.',
      variant: 'default',
      confirmText: 'Logout',
      cancelText: 'Stay Signed In',
    });

    if (!approved) {
      return;
    }

    await logoutUser();
    router.replace('/login');
  };

  const initials = useMemo(
    () =>
      studentName
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join(''),
    [studentName],
  );

  const sidebarItems = useMemo(
    () =>
      sidebarLinks.map((item) => {
        const isActive =
          item.href !== '/student/dashboard' ? pathname.startsWith(item.href) : pathname === item.href;
        const Icon = item.icon;
        const linkClasses = isActive
          ? 'bg-[#1B3B8B] text-white'
          : 'text-slate-700 hover:bg-slate-100';
        const itemLayoutClasses = isMobileSidebarExpanded
          ? 'justify-start px-5'
          : 'justify-center px-0 md:justify-start md:px-5';
        const labelClasses = isMobileSidebarExpanded ? 'inline' : 'hidden md:inline';

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition-colors ${linkClasses} ${itemLayoutClasses}`}
            >
              <Icon className="h-4 w-4" />
              <span className={labelClasses}>{item.label}</span>
            </Link>
          </li>
        );
      }),
    [isMobileSidebarExpanded, pathname],
  );

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking your student access…</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <aside
        className={`flex h-full flex-shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 text-slate-900 transition-[width] duration-200 ${
          isMobileSidebarExpanded ? 'w-64' : 'w-20 md:w-64'
        }`}
      >
        <div
          className={`flex items-center ${
            isMobileSidebarExpanded ? 'gap-3 px-2' : 'justify-center px-0 md:justify-start md:gap-3 md:px-2'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1B3B8B] text-white">
            <span className="text-lg font-semibold">GE</span>
          </div>
          <div className={isMobileSidebarExpanded ? 'block' : 'hidden md:block'}>
            <p className="text-sm font-semibold leading-tight">Genuine English</p>
            <p className="text-xs text-slate-500">Student Portal</p>
          </div>
        </div>

        <nav className="mt-8 flex-1">
          <ul className="space-y-1 text-sm">{sidebarItems}</ul>
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className={`inline-flex w-full items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${
              isMobileSidebarExpanded ? 'justify-start px-5' : 'justify-center px-0 md:justify-start md:px-5'
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span className={isMobileSidebarExpanded ? 'inline' : 'hidden md:inline'}>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileSidebarExpanded((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
              aria-label={isMobileSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isMobileSidebarExpanded ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="relative w-full max-w-xl">
              <input
                type="search"
                placeholder="Search your courses, classes, and quizzes..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pl-11 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </span>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3B8B] text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="text-left text-xs leading-tight">
                <p className="max-w-[10rem] truncate font-semibold text-slate-900">{studentName}</p>
                <p className="text-[0.7rem] text-slate-500">Student</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
