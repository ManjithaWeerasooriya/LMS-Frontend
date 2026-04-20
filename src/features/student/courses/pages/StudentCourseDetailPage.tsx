'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, ClipboardList, FolderOpen, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { logoutUser } from '@/lib/auth';
import {
  getMyStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import {
  getStudentCourseContent,
  type StudentCourseContent,
} from '@/features/student/courses/api';
import { StudentCourseLiveSessionsSection } from '@/features/student/courses/components/StudentCourseLiveSessionsSection';
import { StudentCourseWeekSection } from '@/features/student/courses/components/StudentCourseWeekSection';
import {
  downloadMaterial,
  MaterialsApiError,
  type CourseMaterial,
} from '@/features/student/materials/api/materials';

type StudentCourseDetailPageProps = {
  courseId: string;
};

type StudentCourseDetailState = {
  loading: boolean;
  error: string | null;
  enrolledCourse: StudentCourseListItem | null;
  content: StudentCourseContent | null;
};

const initialState: StudentCourseDetailState = {
  loading: true,
  error: null,
  enrolledCourse: null,
  content: null,
};

const buildCourseMissingMessage = () =>
  'This course is not available in your enrolled courses right now.';

export default function StudentCourseDetailPage({
  courseId,
}: StudentCourseDetailPageProps) {
  const router = useRouter();
  const [state, setState] = useState<StudentCourseDetailState>(initialState);

  const loadCourse = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const enrolledCourses = await getMyStudentCourses();
      const enrolledCourse = enrolledCourses.find((course) => course.id === courseId) ?? null;

      if (!enrolledCourse) {
        setState({
          loading: false,
          error: buildCourseMissingMessage(),
          enrolledCourse: null,
          content: null,
        });
        return;
      }

      const content = await getStudentCourseContent(courseId, enrolledCourse);

      setState({
        loading: false,
        error: null,
        enrolledCourse,
        content,
      });
    } catch (loadError) {
      if (loadError instanceof StudentApiError && loadError.status === 401) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error:
          loadError instanceof StudentApiError
            ? loadError.status === 403
              ? 'You are not authorized to access this course content.'
              : loadError.message
            : 'Unable to load this course right now.',
      }));
    }
  }, [courseId, router]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const handleDownloadMaterial = async (material: CourseMaterial) => {
    try {
      await downloadMaterial(material);
    } catch (downloadError) {
      setState((current) => ({
        ...current,
        error:
          downloadError instanceof MaterialsApiError
            ? downloadError.message
            : 'Unable to download this file right now.',
      }));
    }
  };

  const content = state.content;
  const course = content?.course ?? state.enrolledCourse;
  const hasContent = Boolean(content && (content.materials.length > 0 || content.quizzes.length > 0));
  const shouldShowLiveSessions = state.loading || Boolean(course);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/student/dashboard/courses"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Link>

        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Course Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {course?.title ?? (state.loading ? 'Loading course…' : 'Course')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {course?.description ??
              'Open weekly learning materials, track quizzes, and continue the content published by your instructor.'}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Weeks</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {state.loading ? '—' : content?.weeks.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Materials</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {state.loading ? '—' : content?.materials.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Quizzes</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {state.loading ? '—' : content?.quizzes.length ?? 0}
              </p>
            </div>
          </div>
        </header>
      </div>

      {state.error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Unable to load course content.</p>
          <p className="mt-1">{state.error}</p>
          <button
            type="button"
            onClick={() => void loadCourse()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : null}

      {shouldShowLiveSessions ? <StudentCourseLiveSessionsSection courseId={courseId} /> : null}

      {state.loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <section
              key={`student-course-week-skeleton-${index + 1}`}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((__, cardIndex) => (
                  <div
                    key={`student-course-card-skeleton-${cardIndex + 1}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-4 h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : state.error && !content ? null : hasContent && content ? (
        <div className="space-y-5">
          {content.weeks.map((week) => (
            <StudentCourseWeekSection
              key={week.key}
              courseId={courseId}
              week={week}
              onDownloadMaterial={handleDownloadMaterial}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid w-fit grid-cols-3 gap-3 rounded-3xl bg-slate-50 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FolderOpen className="h-5 w-5" />
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ClipboardList className="h-5 w-5" />
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No published content yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This course does not have materials or quizzes available yet. Check back later for new weekly content.
          </p>
        </div>
      )}
    </div>
  );
}
