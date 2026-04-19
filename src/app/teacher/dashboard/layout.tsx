'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  FileText,
  LineChart,
  LogOut,
  Menu,
  MonitorPlay,
  Package2,
  PanelLeftClose,
  ShieldCheck,
  Settings,
  type LucideIcon,
  Users,
} from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { useConfirm } from '@/context/ConfirmContext';
import { CurrentUserProfileProvider } from '@/hooks/useCurrentUserProfile';
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
  { label: 'Dashboard', href: '/teacher/dashboard', icon: BarChart3 },
  { label: 'My Courses', href: '/teacher/dashboard/courses', icon: BookOpen },
  { label: 'Quizzes', href: '/teacher/dashboard/quizzes', icon: FileText },
  { label: 'Live Sessions', href: '/teacher/dashboard/live-sessions', icon: MonitorPlay },
  { label: 'Analytics', href: '/teacher/dashboard/analytics', icon: LineChart },
  { label: 'Materials', href: '/teacher/dashboard/materials', icon: Package2 },
  { label: 'Users', href: '/teacher/dashboard/users', icon: Users },
  { label: 'Platform Courses', href: '/teacher/dashboard/platform-courses', icon: ShieldCheck },
  { label: 'Reports', href: '/teacher/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/teacher/dashboard/settings', icon: Settings },
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

const getStatusClaim = (payload: DecodedJwt | null): string | undefined => {
  if (!payload) return undefined;
  const value = payload.status ?? payload['status'];
  return typeof value === 'string' ? value : undefined;
};

export default function TeacherDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isMobileSidebarExpanded, setIsMobileSidebarExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const enforceTutorAccess = async () => {
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
      const hasTutorAccess =
        roleFromToken === 'teacher' ||
        roleFromToken === 'instructor' ||
        roleFromToken === 'admin' ||
        storedRole === 'Instructor' ||
        storedRole === 'Admin';

      if (!hasTutorAccess) {
        if (!cancelled) {
          setIsChecking(false);
        }
        router.replace('/dashboard');
        return;
      }

      if (!cancelled) {
        setStatus(getStatusClaim(payload) ?? null);
        setIsAuthorized(true);
        setIsChecking(false);
      }
    };

    void enforceTutorAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    const approved = await confirm({
      title: 'Log out of LMS?',
      description: 'Any ongoing work will be lost if not saved.',
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

  const sidebarItems = useMemo(
    () =>
      sidebarLinks.map((item) => {
        const isActive =
          item.href !== '/teacher/dashboard' ? pathname.startsWith(item.href) : pathname === item.href;
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
        <p className="text-sm text-slate-500">Checking your tutor access…</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Tutor Dashboard
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            You don&apos;t have tutor access
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in with a tutor account if you need access to teaching and management
            tools.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (status && status.toLowerCase() !== 'active') {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
            Tutor Account
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Your account is {statusLabel}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            You&apos;ll be able to access teaching and management tools once your account becomes
            active.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <CurrentUserProfileProvider>
      <div className="flex h-screen bg-slate-100">
        <aside
          className={`flex h-full flex-shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 text-slate-900 transition-[width] duration-200 ${
            isMobileSidebarExpanded ? 'w-72' : 'w-20 md:w-72'
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
              <p className="text-xs text-slate-500">Tutor Console</p>
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
          <AppNavbar
            leading={
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
            }
            contentClassName="flex w-full items-center justify-between px-4 py-3 md:px-6"
          />

          <main className="flex-1 overflow-y-auto bg-slate-100 px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </CurrentUserProfileProvider>
  );
}
