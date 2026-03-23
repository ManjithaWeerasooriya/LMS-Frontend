'use client';

import { useEffect, useState } from 'react';

import { AdminCoursesReport } from '@/app/dashboard/admin/_components/AdminCoursesReport';
import { AdminQuizReport } from '@/app/dashboard/admin/_components/AdminQuizReport';
import { AdminReportsOverview } from '@/app/dashboard/admin/_components/AdminReportsOverview';
import {
  AdminApiError,
  type AdminCourseReportItem,
  type AdminCoursesReportResponse,
  type AdminOverviewReport,
  type AdminQuizPerformanceBand,
  type AdminQuizReportSummary,
  type CourseAttendanceDto,
  type QuizAverageScoreDto,
  type ReportsOverviewResponse,
  getAdminReportsOverview,
} from '@/lib/admin';

const metricSynonyms = {
  users: ['totalusers', 'users', 'usercount', 'totalusercount'],
  courses: ['totalcourses', 'coursecount', 'courses'],
  enrollments: ['totalenrollments', 'enrollmentcount', 'enrollments', 'students'],
  completion: ['completionrate', 'completionpercent', 'completionpercentage', 'completion'],
} as const;

const normaliseToken = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const readMetric = (source: unknown, keys: string[], fallback = 0): number => {
  if (!source || typeof source !== 'object' || !keys.length) {
    return fallback;
  }
  const normalizedTargets = keys.map((key) => normaliseToken(key));
  for (const [rawKey, rawValue] of Object.entries(source as Record<string, unknown>)) {
    const normalizedKey = normaliseToken(rawKey);
    if (normalizedTargets.some((target) => normalizedKey.includes(target))) {
      const parsed = toNumber(rawValue);
      if (parsed != null) {
        return parsed;
      }
    }
  }
  return fallback;
};

const deepFindMetric = (
  node: unknown,
  synonyms: readonly string[],
  visited = new WeakSet<object>(),
  depth = 0,
): number | undefined => {
  if (depth > 5) return undefined;
  if (!node) return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const result = deepFindMetric(item, synonyms, visited, depth + 1);
      if (result != null) return result;
    }
    return undefined;
  }
  if (typeof node !== 'object') {
    return undefined;
  }
  const obj = node as Record<string, unknown>;
  if (visited.has(obj)) return undefined;
  visited.add(obj);

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normaliseToken(key);
    if (synonyms.some((syn) => normalizedKey.includes(syn))) {
      const parsed = toNumber(value);
      if (parsed != null) return parsed;
    }
  }

  if (typeof obj.label === 'string') {
    const normalizedLabel = normaliseToken(obj.label);
    if (synonyms.some((syn) => normalizedLabel.includes(syn))) {
      const parsed = toNumber(obj.value ?? obj.count ?? obj.total ?? obj.amount);
      if (parsed != null) return parsed;
    }
  }

  for (const value of Object.values(obj)) {
    const result = deepFindMetric(value, synonyms, visited, depth + 1);
    if (result != null) return result;
  }
  return undefined;
};

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminReportsOverview();
        if (!active) return;
        setReport(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof AdminApiError ? err.message : 'Unable to load system reports.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadReport();
    return () => {
      active = false;
    };
  }, []);

  const extractMetric = (
    context: unknown,
    summary: Record<string, unknown> | null | undefined,
    synonyms: readonly string[],
    fallback?: number,
  ): number | undefined => {
    const result = deepFindMetric(summary, synonyms) ?? deepFindMetric(context, synonyms);
    return result != null ? result : fallback;
  };

  const normalisePagedCourses = (source: unknown) => {
    if (!source) {
      return {
        pageNumber: 1,
        pageSize: 0,
        totalCount: 0,
        items: [] as AdminCourseReportItem[],
      };
    }
    if (Array.isArray(source)) {
      const items = source as AdminCourseReportItem[];
      return {
        pageNumber: 1,
        pageSize: items.length,
        totalCount: items.length,
        items,
      };
    }
    const record = source as {
      pageNumber?: number;
      pageSize?: number;
      totalCount?: number;
      items?: AdminCourseReportItem[];
    };
    const items = Array.isArray(record.items) ? record.items : [];
    return {
      pageNumber: record.pageNumber ?? 1,
      pageSize: record.pageSize ?? items.length,
      totalCount: record.totalCount ?? items.length,
      items,
    };
  };

  const rawEnrollmentCourses =
    report?.enrollment?.courses ?? report?.enrollment?.enrollmentByCourse ?? [];
  const enrollmentCourses = normalisePagedCourses(rawEnrollmentCourses);

  const overviewData: AdminOverviewReport | null = report
    ? {
        totalUsers: report.enrollment?.totalStudents ?? 0,
        totalCourses: enrollmentCourses.totalCount ?? enrollmentCourses.items.length,
        totalEnrollments:
          report.enrollment?.totalEnrollments ??
          enrollmentCourses.items.reduce((sum, item) => sum + (item.enrollmentCount ?? 0), 0),
        completionRate:
          extractMetric(
            report.enrollment,
            report.enrollment?.summary,
            metricSynonyms.completion,
            0,
          ) ?? 0,
      }
    : null;

  const normaliseCourseItem = (item: Partial<AdminCourseReportItem>): AdminCourseReportItem => ({
    courseId:
      item.courseId ??
      (item.courseTitle ? item.courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined) ??
      `course-${Math.random().toString(36).slice(2)}`,
    courseTitle: item.courseTitle ?? 'Untitled Course',
    teacherName: item.teacherName ?? (item as { instructorName?: string }).instructorName ?? null,
    enrollmentCount:
      typeof item.enrollmentCount === 'number' && Number.isFinite(item.enrollmentCount)
        ? item.enrollmentCount
        : Number(item.enrollmentCount) || 0,
    completionRate:
      typeof item.completionRate === 'number' && Number.isFinite(item.completionRate)
        ? item.completionRate
        : Number(item.completionRate) || 0,
    status: item.status ?? (item as { courseStatus?: string }).courseStatus ?? 'Unknown',
  });

  const coursesReport: AdminCoursesReportResponse | null = report
    ? {
        courses: (enrollmentCourses.items ?? []).map((item) =>
          normaliseCourseItem(item as Partial<AdminCourseReportItem>),
        ),
      }
    : null;

  const normaliseBands = (bands: ReportsOverviewResponse['quizzes']['performanceBands']) => {
    if (Array.isArray(bands)) {
      return bands as AdminQuizPerformanceBand[];
    }
    if (bands && typeof bands === 'object') {
      return Object.entries(bands).map(([label, value]) => ({
        label,
        percentage: typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0,
      }));
    }
    return [];
  };

  const quizSummaryRaw = report?.quizzes?.summary;
  const quizReport: AdminQuizReportSummary | null = quizSummaryRaw
    ? {
        averageScore: readMetric(quizSummaryRaw, ['averageScore', 'avgScore']),
        passRate: readMetric(quizSummaryRaw, ['passRate', 'passPercentage', 'passPercent']),
        performanceBands: normaliseBands(report?.quizzes?.performanceBands),
      }
    : report?.quizzes
      ? {
          averageScore: 0,
          passRate: 0,
          performanceBands: normaliseBands(report.quizzes.performanceBands),
        }
      : null;

  const quizList: QuizAverageScoreDto[] = report?.quizzes?.quizzes ?? [];
  const attendanceCourses: CourseAttendanceDto[] = report?.attendance?.courses ?? [];

  const enrollmentPaging = enrollmentCourses;
  const enrollmentPageNumber = enrollmentPaging.pageNumber;
  const enrollmentPageSize = enrollmentPaging.pageSize;
  const enrollmentTotalCount = enrollmentPaging.totalCount;
  const enrollmentStart =
    enrollmentTotalCount === 0 ? 0 : (enrollmentPageNumber - 1) * enrollmentPageSize + 1;
  const enrollmentEnd =
    enrollmentTotalCount === 0
      ? 0
      : Math.min(enrollmentTotalCount, enrollmentPageNumber * enrollmentPageSize);

  return (
    <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Admin</p>
          <h1 className="text-3xl font-semibold text-slate-900">System Reports</h1>
          <p className="text-sm text-slate-500">Monitor enrollments, completion, and quiz performance metrics.</p>
        </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <AdminReportsOverview data={overviewData} loading={loading} error={error} />
      <AdminCoursesReport report={coursesReport} loading={loading} error={error} />

      {enrollmentPaging ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-900">
            Showing {enrollmentStart}-{enrollmentEnd} of {enrollmentTotalCount} courses
          </p>
          <p className="text-xs text-slate-500">
            Page {enrollmentPageNumber} · Page Size {enrollmentPageSize}
          </p>
        </div>
      ) : null}

      <AdminQuizReport report={quizReport} loading={loading} error={error} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Quizzes</p>
            <h2 className="text-xl font-semibold text-slate-900">Quiz Averages</h2>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Average Score</th>
                  <th className="px-4 py-3">Pass Rate</th>
                  <th className="px-4 py-3">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-slate-500" colSpan={4}>
                      Loading quiz statistics…
                    </td>
                  </tr>
                ) : quizList.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-slate-500" colSpan={4}>
                      No quiz statistics available.
                    </td>
                  </tr>
                ) : (
                  quizList.map((quiz) => (
                    <tr key={quiz.quizId}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{quiz.quizTitle}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {typeof quiz.averageScore === 'number'
                          ? `${quiz.averageScore.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {typeof quiz.passRate === 'number' ? `${quiz.passRate.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{quiz.attempts ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Attendance</p>
            <h2 className="text-xl font-semibold text-slate-900">Course Attendance</h2>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Attendance Rate</th>
                  <th className="px-4 py-3">Sessions Held</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                      Loading attendance…
                    </td>
                  </tr>
                ) : attendanceCourses.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                      No attendance data available.
                    </td>
                  </tr>
                ) : (
                  attendanceCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{course.courseTitle}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {typeof course.attendanceRate === 'number'
                          ? `${course.attendanceRate.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {typeof course.sessionsHeld === 'number'
                          ? course.sessionsHeld.toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
