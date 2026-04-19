'use client';

import Link from 'next/link';
import { BookOpen, Download, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MaterialList } from '@/features/teacher/materials/components/MaterialList';
import {
  getMyStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import {
  downloadMaterial,
  getCourseMaterials,
  MaterialsApiError,
  type CourseMaterial,
} from '@/features/student/materials/api/materials';
import { logoutUser } from '@/lib/auth';

type EnrolledCourseMaterials = {
  course: StudentCourseListItem;
  materials: CourseMaterial[];
};

type PageState = {
  loading: boolean;
  error: string | null;
  unauthorized: boolean;
  sections: EnrolledCourseMaterials[];
};

const initialState: PageState = {
  loading: true,
  error: null,
  unauthorized: false,
  sections: [],
};

export default function StudentMaterialsPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>(initialState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMaterials = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
      unauthorized: false,
    }));

    try {
      const enrolledCourses = await getMyStudentCourses();
      const sections = await Promise.all(
        enrolledCourses.map(async (course) => ({
          course,
          materials: await getCourseMaterials(course.id),
        })),
      );

      setState({
        loading: false,
        error: null,
        unauthorized: false,
        sections: sections.filter((section) => section.materials.length > 0),
      });
    } catch (err) {
      if (err instanceof StudentApiError && err.status === 401) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      if (err instanceof StudentApiError && err.status === 403) {
        setState({
          loading: false,
          error: 'You are not authorized to access enrolled course materials.',
          unauthorized: true,
          sections: [],
        });
        return;
      }

      if (err instanceof MaterialsApiError) {
        if (err.status === 401) {
          await logoutUser();
          router.replace('/login');
          return;
        }

        setState({
          loading: false,
          error:
            err.status === 403
              ? 'You are not authorized to access student course materials.'
              : err.message,
          unauthorized: err.status === 403,
          sections: [],
        });
        return;
      }

      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Unable to load your course materials.',
        unauthorized: false,
        sections: [],
      });
    }
  }, [router]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadMaterials();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (material: CourseMaterial) => {
    try {
      await downloadMaterial(material.id);
    } catch (err) {
      if (err instanceof MaterialsApiError) {
        if (err.status === 401) {
          await logoutUser();
          router.replace('/login');
          return;
        }

        setState((current) => ({
          ...current,
          error:
            err.status === 403
              ? 'You are not authorized to download this material.'
              : err.message,
          unauthorized: err.status === 403,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        error: 'Unable to download this file right now.',
        unauthorized: false,
      }));
    }
  };

  const totalMaterials = useMemo(
    () => state.sections.reduce((sum, section) => sum + section.materials.length, 0),
    [state.sections],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Materials</p>
        <h1 className="text-3xl font-semibold text-slate-900">My Course Materials</h1>
        <p className="text-sm text-slate-500">
          Review the files published to courses you are currently enrolled in.
        </p>
      </header>

      {state.error ? (
        <div
          className={`rounded-3xl border p-4 text-sm ${
            state.unauthorized
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          <p className="font-semibold">
            {state.unauthorized ? 'Access restricted.' : 'Unable to load materials.'}
          </p>
          <p className="mt-1">{state.error}</p>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Enrolled Material Library
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {state.loading ? '—' : totalMaterials}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {state.loading
                ? 'Checking your enrolled courses.'
                : 'Only materials from your enrolled courses are shown here.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-slate-50"
            disabled={state.loading || isRefreshing}
          >
            <RefreshCcw className="h-4 w-4" />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {state.loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`student-materials-skeleton-${index + 1}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : state.sections.length > 0 ? (
        <div className="space-y-5">
          {state.sections.map((section) => (
            <section
              key={section.course.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Enrolled Course
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {section.course.title}
                  </h2>
                </div>

                <Link
                  href={`/student/dashboard/courses/${section.course.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-slate-50"
                >
                  <BookOpen className="h-4 w-4" />
                  Open Course
                </Link>
              </div>

              <MaterialList
                materials={section.materials}
                role="student"
                onDownload={handleDownload}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Download className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">No materials published yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your enrolled courses do not have downloadable materials yet. Check again after your
            instructor publishes new content.
          </p>
        </div>
      )}
    </div>
  );
}
