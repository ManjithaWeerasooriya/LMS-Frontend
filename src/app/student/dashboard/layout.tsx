'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  Package2,
  PanelLeftClose,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { AppNavbar } from '@/components/AppNavbar';
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
  { label: 'My Courses', href: '/student/dashboard/courses', icon: BookOpen },
  { label: 'Materials', href: '/student/dashboard/materials', icon: Package2 },
  { label: 'Settings', href: '/student/dashboard/settings', icon: Settings },
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

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
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
  );
}
