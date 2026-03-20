'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart2,
  BookOpen,
  FileText,
  GraduationCap,
  Headphones,
  Home,
  LogOut,
  MessageCircle,
  MonitorPlay,
  ShoppingBag,
} from 'lucide-react';

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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/dashboard/student', icon: Home },
  { label: 'My Courses', href: '/dashboard/student/my-courses', icon: BookOpen },
  { label: 'Live Classes', href: '/dashboard/student/live-classes', icon: MonitorPlay },
  { label: 'Quizzes', href: '/dashboard/student/quizzes', icon: FileText },
  { label: 'Results', href: '/dashboard/student/results', icon: BarChart2 },
  { label: 'Grades', href: '/dashboard/student/grades', icon: GraduationCap },
  { label: 'Tute Tracking', href: '/dashboard/student/tute-tracking', icon: Headphones },
  { label: 'Store', href: '/dashboard/student/store', icon: ShoppingBag },
  { label: 'Contact', href: '/dashboard/student/contact', icon: MessageCircle },
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

export default function StudentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('Student');

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
      const hasStudentRole =
        roleFromToken === 'student' || storedRole === 'Student';

      if (!hasStudentRole) {
        if (!cancelled) {
          setIsChecking(false);
        }

        if (storedRole === 'Instructor') {
          router.replace('/dashboard/teacher');
        } else if (storedRole === 'Admin') {
          router.replace('/dashboard/admin');
        } else {
          router.replace('/');
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
        const isDashboard = item.href === '/dashboard/student';
        const isActive = isDashboard
          ? pathname === item.href || pathname === `${item.href}/`
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const Icon = item.icon;
        const baseClasses =
          'flex items-center gap-3 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors';
        const activeClasses = isActive
          ? 'bg-[#1B3B8B] text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-50';

        return (
          <li key={item.href}>
            <Link href={item.href} className={`${baseClasses} ${activeClasses}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        );
      }),
    [pathname],
  );

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-slate-600 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-semibold">Verifying student access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 text-slate-900 md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1B3B8B] text-white">
            <span className="text-lg font-semibold">GE</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Genuine English</p>
            <p className="text-xs text-slate-500">with Isuru Samarakoon</p>
          </div>
        </div>

        <nav className="mt-8 flex-1">
          <ul className="space-y-1 text-sm">{sidebarItems}</ul>
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-start gap-3 rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-full flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1B3B8B] text-white">
                GE
              </div>
            </div>
            <div className="relative w-full max-w-xl">
              <input
                type="search"
                placeholder="Search courses, materials, students..."
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
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Notifications"
            >
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
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-semibold text-white">
                3
              </span>
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3B8B] text-xs font-semibold text-white">
                {studentName
                  .split(' ')
                  .map((part) => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="hidden text-left text-xs leading-tight md:block">
                <p className="max-w-[10rem] truncate font-semibold text-slate-900">
                  {studentName}
                </p>
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
