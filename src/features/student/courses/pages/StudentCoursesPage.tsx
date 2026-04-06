'use client';

import { Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  enrollInStudentCourse,
  getMyStudentCourses,
  getStudentCourses,
  StudentApiError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import { logoutUser } from '@/lib/auth';

type ActiveTab = 'enrolled' | 'available';

type CoursesState = {
  enrolled: StudentCourseListItem[];
  available: StudentCourseListItem[];
  loading: boolean;
  error: string | null;
};

const initialState: CoursesState = {
  enrolled: [],
  available: [],
  loading: true,
  error: null,
};

  export default function StudentCoursesPage() {
    const router = useRouter();
    const [state, setState] = useState<CoursesState>(initialState);
    const [activeTab, setActiveTab] = useState<ActiveTab>('enrolled');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [enrolled, available] = await Promise.all([
          getMyStudentCourses(),
          getStudentCourses(),
        ]);

        if (!active) return;

        setState({
          enrolled,
          available,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;

        if (error instanceof StudentApiError && (error.status === 401 || error.status === 403)) {
          await logoutUser();
          router.replace('/login');
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof StudentApiError
              ? error.message
              : 'Unable to load your courses.',
        }));
      }
    };

    void loadCourses();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSearch = async (value: string) => {
    const trimmed = value.trim();

    setSearch(value);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [enrolled, available] = await Promise.all([
        getMyStudentCourses(),
        getStudentCourses(trimmed || undefined),
      ]);

      setState({
        enrolled,
        available,
        loading: false,
        error: null,
      });
    } catch (error) {
      if (error instanceof StudentApiError && (error.status === 401 || error.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof StudentApiError
            ? error.message
            : 'Unable to search courses.',
      }));
    }
  };

  const handleEnroll = async (course: StudentCourseListItem) => {
    try {
      await enrollInStudentCourse(course.id);

      setState((prev) => {
        // Mark as enrolled in available list and add to enrolled if not already there.
        const updatedAvailable = prev.available.map((c) =>
          c.id === course.id ? { ...c, isEnrolled: true } : c,
        );

        const alreadyInEnrolled = prev.enrolled.some((c) => c.id === course.id);
        const updatedEnrolled = alreadyInEnrolled
          ? prev.enrolled
          : [...prev.enrolled, { ...course, isEnrolled: true }];

        return {
          ...prev,
          enrolled: updatedEnrolled,
          available: updatedAvailable,
        };
      });
    } catch (error) {
      if (error instanceof StudentApiError && (error.status === 401 || error.status === 403)) {
        await logoutUser();
        router.replace('/login');
        return;
      }

      setState((prev) => ({
        ...prev,
        error:
          error instanceof StudentApiError
            ? error.message
            : 'Unable to enroll in this course.',
      }));
    }
  };

  const visibleCourses = useMemo(
    () =>
      activeTab === 'enrolled'
        ? state.enrolled
        : state.available.filter((course) => !course.isEnrolled),
    [activeTab, state.enrolled, state.available],
  );

  const hasCourses = visibleCourses.length > 0;
  const description =
    activeTab === 'available'
      ? 'Browse courses you can enroll in.'
      : 'View courses you have already enrolled in.';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Courses</p>
        <h1 className="text-3xl font-semibold text-slate-900">My Courses</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('enrolled')}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              activeTab === 'enrolled'
                ? 'bg-[#1B3B8B] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Enrolled Courses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              activeTab === 'available'
                ? 'bg-[#1B3B8B] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Available Courses
          </button>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
            ⌘
          </span>
          Filters
        </button>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:px-5">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleSearch(search);
            }
          }}
          placeholder="Search courses by title or instructor..."
          className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </div>

      {state.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {state.loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="h-32 bg-gradient-to-r from-[#1B3B8B] to-blue-500" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-200" />
              </div>
            </article>
          ))
        ) : !hasCourses ? (
          <p className="col-span-full text-center text-sm text-slate-500">
            {activeTab === 'enrolled'
              ? 'You have not enrolled in any courses yet.'
              : 'No courses are available at the moment.'}
          </p>
        ) : (
          visibleCourses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between bg-gradient-to-r from-[#1B3B8B] to-blue-500 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
                    {course.category || 'Active'}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold leading-tight">
                    {course.title}
                  </h2>
                </div>
                {course.isEnrolled ? (
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <Star className="h-4 w-4 text-yellow-300" />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Instructor
                    </span>
                    <span className="font-semibold">
                      {course.instructorName || 'To be assigned'}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      Price
                    </span>
                    <span className="font-semibold">
                      {typeof course.price === 'number'
                        ? `Rs. ${course.price.toFixed(2)}`
                        : 'Included'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    {typeof course.studentsEnrolled === 'number'
                      ? `${course.studentsEnrolled} student${
                          course.studentsEnrolled === 1 ? '' : 's'
                        } enrolled`
                      : 'Be the first to enroll'}
                  </span>
                  {typeof course.rating === 'number' ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="font-semibold text-slate-700">
                        {course.rating.toFixed(1)}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className="pt-2">
                  {course.isEnrolled || activeTab === 'enrolled' ? (
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162f70]"
                    >
                      View Course
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleEnroll(course)}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162f70]"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
