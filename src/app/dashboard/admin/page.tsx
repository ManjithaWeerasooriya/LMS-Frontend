'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminApiError, getAdminCourses, getAdminUsers } from '@/lib/admin';
import { logoutUser } from '@/lib/auth';

type CardState = {
  title: string;
  value: number | string | null;
  loading?: boolean;
  error?: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalUsersError, setTotalUsersError] = useState<string | null>(null);
  const [isLoadingTotalUsers, setIsLoadingTotalUsers] = useState(true);
  const [totalCourses, setTotalCourses] = useState<number | null>(null);
  const [totalCoursesError, setTotalCoursesError] = useState<string | null>(null);
  const [isLoadingTotalCourses, setIsLoadingTotalCourses] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTotals = async () => {
      try {
        const [usersResponse, coursesResponse] = await Promise.all([
          getAdminUsers({ pageNumber: 1, pageSize: 1 }),
          getAdminCourses({ pageNumber: 1, pageSize: 1 }),
        ]);
        if (!isMounted) {
          return;
        }
        setTotalUsers(usersResponse.totalCount ?? 0);
        setTotalCourses(coursesResponse.totalCount ?? 0);
        setTotalUsersError(null);
        setTotalCoursesError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        if (error instanceof AdminApiError) {
          if (error.status === 401 || error.status === 403) {
            await logoutUser();
            router.replace('/login');
            return;
          }
          setTotalUsersError('Unable to load');
          setTotalCoursesError('Unable to load');
        } else {
          setTotalUsersError('Unable to load');
          setTotalCoursesError('Unable to load');
        }
      } finally {
        if (isMounted) {
          setIsLoadingTotalUsers(false);
          setIsLoadingTotalCourses(false);
        }
      }
    };

    void fetchTotals();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const cards: CardState[] = [
    {
      title: 'Total Users',
      value: totalUsers,
      loading: isLoadingTotalUsers,
      error: totalUsersError,
    },
    {
      title: 'Total Courses',
      value: totalCourses,
      loading: isLoadingTotalCourses,
      error: totalCoursesError,
    },
    {
      title: 'Active Live Sessions',
      value: 0,
    },
    {
      title: 'System Revenue',
      value: '$0',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor users, courses, and revenue at a glance.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">{card.title}</p>
            <div className="mt-2 min-h-[2.5rem]">
              {card.loading ? (
                <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
              ) : card.error ? (
                <p className="text-sm font-semibold text-rose-600">{card.error}</p>
              ) : (
                <p className="text-2xl font-semibold text-slate-900">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">Data refreshes when backend metrics are available.</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">User Growth</p>
          <p className="mt-3 font-semibold text-slate-900">Data coming soon</p>
          <p className="mt-2 text-sm text-slate-500">Connect analytics endpoint to visualize trends.</p>
        </article>
        <article className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Course Enrollment</p>
          <p className="mt-3 font-semibold text-slate-900">Data coming soon</p>
          <p className="mt-2 text-sm text-slate-500">Enrollments will display once backend metrics are ready.</p>
        </article>
      </section>
    </div>
  );
}
