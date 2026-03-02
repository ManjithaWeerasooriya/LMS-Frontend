'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { decodeJwt, getStoredAuthToken, logoutUser, type DecodedJwt } from '@/lib/auth';

const sidebarLinks = [
  { label: 'Dashboard', href: '/dashboard/admin' },
  { label: 'Users', href: '/dashboard/admin/users' },
  { label: 'Courses', href: '/dashboard/admin/courses', disabled: true },
  { label: 'Reports', href: '/dashboard/admin/reports', disabled: true },
  { label: 'Live Sessions', href: '/dashboard/admin/live-sessions', disabled: true },
  { label: 'Store', href: '/dashboard/admin/store', disabled: true },
  { label: 'Settings', href: '/dashboard/admin/settings', disabled: true },
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

const getNameClaim = (payload: DecodedJwt | null): string => {
  if (!payload) return 'Admin User';
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
  return 'Admin User';
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');

  useEffect(() => {
    let cancelled = false;

    const enforceAdminAccess = async () => {
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

      const role = getRoleClaim(payload);
      if (!role || role.toLowerCase() !== 'admin') {
        if (!cancelled) {
          setIsChecking(false);
        }
        router.replace('/dashboard');
        return;
      }

      if (!cancelled) {
        setAdminName(getNameClaim(payload));
        setIsAuthorized(true);
        setIsChecking(false);
      }
    };

    void enforceAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  const sidebarItems = useMemo(
    () =>
      sidebarLinks.map((item) => {
        const isActive = item.href !== '/dashboard/admin' ? pathname.startsWith(item.href) : pathname === item.href;
        const baseClasses =
          'flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:bg-white/10';
        const activeClasses = isActive ? 'bg-white/20 text-white' : 'text-slate-200';
        const disabledClasses = item.disabled ? 'cursor-not-allowed opacity-50' : '';

        return (
          <li key={item.href}>
            {item.disabled ? (
              <span className={`${baseClasses} ${disabledClasses}`}>{item.label}</span>
            ) : (
              <Link href={item.href} className={`${baseClasses} ${activeClasses}`}>
                {item.label}
              </Link>
            )}
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
          <p className="text-sm font-semibold">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex h-screen w-64 flex-col justify-between bg-[#1f2a44] px-5 py-6 text-white">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-200">Genuine English</p>
            <h1 className="text-xl font-semibold">Admin Panel</h1>
          </div>
          <nav>
            <ul className="space-y-2">{sidebarItems}</ul>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Logout
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="search"
              placeholder="Search courses, materials, students..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              aria-label="Notifications"
            >
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
              🔔
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                {adminName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">{adminName}</p>
                <p className="text-xs uppercase tracking-wide text-blue-700">Admin</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
