'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenCheck, FileBarChart2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AdminReportsOverview } from '@/features/teacher/components/admin/AdminReportsOverview';
import {
  AdminApiError,
  getAdminOverviewReport,
  type AdminOverviewReport,
} from '@/features/teacher/api/admin';
import { TeacherDashboardHome } from '@/features/teacher/components/TeacherDashboardHome';
import { logoutUser } from '@/lib/auth';

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: typeof Users;
};

const quickActions: QuickAction[] = [
  {
    title: 'Manage Users',
    description: 'Review students and handle teacher account activation from one place.',
    href: '/teacher/dashboard/users',
    icon: Users,
  },
  {
    title: 'Moderate Courses',
    description: 'Review the full platform catalog, disable courses, and remove outdated content.',
    href: '/teacher/dashboard/platform-courses',
    icon: BookOpenCheck,
  },
  {
    title: 'View Reports',
    description: 'Monitor enrollments, completion trends, and quiz performance across the platform.',
    href: '/teacher/dashboard/reports',
    icon: FileBarChart2,
  },
];

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverviewReport | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError(null);

      try {
        const data = await getAdminOverviewReport();
        if (!active) return;
        setOverview(data);
      } catch (error) {
        if (!active) return;

        if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
          await logoutUser();
          router.replace('/login');
          return;
        }

        setOverviewError(
          error instanceof AdminApiError ? error.message : 'Unable to load platform overview.',
        );
      } finally {
        if (active) {
          setLoadingOverview(false);
        }
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="space-y-10">
      <TeacherDashboardHome />

      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Platform Controls</p>
          <h2 className="text-3xl font-semibold text-slate-900">Teacher + Admin Overview</h2>
          <p className="text-sm text-slate-500">
            This dashboard now combines teaching tools with platform-level management.
          </p>
        </header>

        <AdminReportsOverview
          data={overview}
          loading={loadingOverview}
          error={overviewError}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-blue-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
