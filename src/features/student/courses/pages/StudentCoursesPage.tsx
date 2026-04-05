'use client';

import Link from 'next/link';
import { BookOpen, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { logoutUser } from '@/lib/auth';
import {
  getMyStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import { StudentCourseCard } from '@/features/student/courses/components/StudentCourseCard';

const buildEmptyState = () => (
  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
      <BookOpen className="h-6 w-6" />
    </div>
    <h2 className="mt-4 text-xl font-semibold text-slate-900">No enrolled courses yet</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">
      When you enroll in a course, it will appear here with weekly materials and quizzes.
    </p>
    <Link
      href="/courses"
      className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17306f]"
    >
      Browse course catalog
    </Link>
  </div>
);

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<StudentCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMyStudentCourses();
      setCourses(data);
    } catch (loadError) {
      if (loadError instanceof StudentApiError && (loadError.status === 401 || loadError.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setError(
        loadError instanceof StudentApiError
          ? loadError.message
          : 'Unable to load your enrolled courses.',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Student Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">My Courses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Open each enrolled course to review materials, files, and quizzes grouped by week.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCourses()}
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load your courses.</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void loadCourses()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={`student-course-skeleton-${index + 1}`}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
            >
              <div className="h-44 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
                <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
              </div>
            </article>
          ))}
        </div>
      ) : courses.length === 0 ? (
        buildEmptyState()
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <StudentCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
