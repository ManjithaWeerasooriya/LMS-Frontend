'use client';

import { useEffect, useState } from 'react';

import { AdminCoursesReport } from '@/app/dashboard/admin/_components/AdminCoursesReport';
import { AdminQuizReport } from '@/app/dashboard/admin/_components/AdminQuizReport';
import { AdminReportsOverview } from '@/app/dashboard/admin/_components/AdminReportsOverview';
import {
  AdminApiError,
  type AdminCoursesReportResponse,
  type AdminOverviewReport,
  type AdminQuizReportSummary,
  getAdminCoursesReport,
  getAdminOverviewReport,
  getAdminQuizReport,
} from '@/lib/admin';

export default function AdminReportsPage() {
  const [overview, setOverview] = useState<AdminOverviewReport | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [coursesReport, setCoursesReport] = useState<AdminCoursesReportResponse | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [quizReport, setQuizReport] = useState<AdminQuizReportSummary | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const data = await getAdminOverviewReport();
        if (!active) return;
        setOverview(data);
      } catch (err) {
        if (!active) return;
        setOverviewError(err instanceof AdminApiError ? err.message : 'Unable to load overview.');
      } finally {
        if (active) setOverviewLoading(false);
      }
    };
    void loadOverview();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCoursesReport = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const data = await getAdminCoursesReport();
        if (!active) return;
        setCoursesReport(data);
      } catch (err) {
        if (!active) return;
        setCoursesError(err instanceof AdminApiError ? err.message : 'Unable to load courses report.');
      } finally {
        if (active) setCoursesLoading(false);
      }
    };
    void loadCoursesReport();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadQuizReport = async () => {
      setQuizLoading(true);
      setQuizError(null);
      try {
        const data = await getAdminQuizReport();
        if (!active) return;
        setQuizReport(data);
      } catch (err) {
        if (!active) return;
        setQuizError(err instanceof AdminApiError ? err.message : 'Unable to load quiz report.');
      } finally {
        if (active) setQuizLoading(false);
      }
    };
    void loadQuizReport();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Admin</p>
          <h1 className="text-3xl font-semibold text-slate-900">System Reports</h1>
          <p className="text-sm text-slate-500">Monitor enrollments, completion, and quiz performance metrics.</p>
        </header>

      <AdminReportsOverview data={overview} loading={overviewLoading} error={overviewError} />
      <AdminCoursesReport report={coursesReport} loading={coursesLoading} error={coursesError} />
      <AdminQuizReport report={quizReport} loading={quizLoading} error={quizError} />
    </div>
  );
}
