'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  LayoutGrid,
  Search,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';

import { getMyStudentCourses, StudentApiError } from '@/features/student/api/student';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { Course } from '@/lib/courses';
import { withRedirect } from '@/lib/navigation';

import {
  formatCourseDuration,
  formatCoursePrice,
  getCourseCategories,
  sortCourses,
  type CourseSortOption,
} from '../utils';

type CourseCatalogClientProps = {
  courses: Course[];
  error: string | null;
  initialSearch: string;
  initialCategory: string;
  initialSort: CourseSortOption;
};

const sortOptions: Array<{ value: CourseSortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'duration-desc', label: 'Longest First' },
];

function buildCatalogUrl(search: string, category: string, sort: CourseSortOption) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (category.trim()) {
    params.set('category', category.trim());
  }

  if (sort !== 'featured') {
    params.set('sort', sort);
  }

  const query = params.toString();
  return `/courses${query ? `?${query}` : ''}`;
}

export function CourseCatalogClient({
  courses,
  error,
  initialSearch,
  initialCategory,
  initialSort,
}: CourseCatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthSession();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => getCourseCategories(courses), [courses]);

  const visibleCourses = useMemo(() => {
    const filtered = initialCategory
      ? courses.filter((course) => (course.category ?? '').toLowerCase() === initialCategory.toLowerCase())
      : courses;

    return sortCourses(filtered, initialSort);
  }, [courses, initialCategory, initialSort]);

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (!session.isAuthenticated || session.role !== 'Student') {
      setEnrolledCourseIds(new Set());
      return;
    }

    let isMounted = true;

    void getMyStudentCourses()
      .then((studentCourses) => {
        if (!isMounted) return;
        setEnrolledCourseIds(new Set(studentCourses.map((course) => course.id)));
      })
      .catch((loadError) => {
        if (!isMounted) return;
        if (loadError instanceof StudentApiError && (loadError.status === 401 || loadError.status === 403)) {
          setEnrolledCourseIds(new Set());
          return;
        }
        console.warn('[CourseCatalogClient] Unable to load student course status', loadError);
      });

    return () => {
      isMounted = false;
    };
  }, [session.isAuthenticated, session.role]);

  const applyFilters = (search: string, category: string, sort: CourseSortOption) => {
    startTransition(() => {
      router.push(buildCatalogUrl(search, category, sort));
    });
  };

  const loginHref = withRedirect('/login', pathname);
  const registerHref = withRedirect('/register/student', pathname);

  return (
    <main className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_38%,#f8fafc_100%)]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-800">
              <Sparkles className="h-4 w-4" />
              Explore Courses
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                A cleaner, faster way to browse the full course catalog.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Discover high-quality courses with better structure, clearer comparisons, and a smoother
                path into enrollment.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{courses.length}</p>
                <p className="mt-1 text-sm text-slate-500">Courses available to browse</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Categories</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{categories.length}</p>
                <p className="mt-1 text-sm text-slate-500">Tracks to compare and filter</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Access</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {session.role === 'Student' ? 'Student' : 'Public'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {session.role === 'Student'
                    ? 'Your enrolled courses are labeled below.'
                    : 'Browse freely before signing in.'}
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.28)]">
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <LayoutGrid className="h-5 w-5" />
              Improved catalog experience
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Browse first, enroll when you&apos;re ready.</h2>

            <div className="mt-6 grid gap-3">
              <Link
                href={session.isAuthenticated ? '/student/dashboard' : loginHref}
                className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {session.isAuthenticated ? 'Open dashboard' : 'Sign in to continue'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!session.isAuthenticated ? (
                <Link
                  href={registerHref}
                  className="inline-flex items-center justify-between rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Create student account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form
              className="grid gap-4 lg:flex-1 lg:grid-cols-[minmax(0,1.6fr)_220px_220px]"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters(searchInput, initialCategory, initialSort);
              }}
            >
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    name="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by title, topic, teacher, or category"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</span>
                <select
                  value={initialCategory}
                  onChange={(event) => applyFilters(searchInput, event.target.value, initialSort)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sort by</span>
                <select
                  value={initialSort}
                  onChange={(event) =>
                    applyFilters(searchInput, initialCategory, event.target.value as CourseSortOption)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </form>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  applyFilters('', '', 'featured');
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reset filters
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'}
            </span>
            {initialSearch ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-800">
                Search: {initialSearch}
              </span>
            ) : null}
            {initialCategory ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
                Category: {initialCategory}
              </span>
            ) : null}
            {isPending ? <span className="text-blue-700">Updating catalog…</span> : null}
          </div>
        </section>

        {error ? (
          <section className="mt-8 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
            <h2 className="text-xl font-semibold">Catalog unavailable</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">{error}</p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              Reload catalog
            </Link>
          </section>
        ) : null}

        {!error && visibleCourses.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">No courses match these filters.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Try a different search term, switch categories, or reset the catalog to see every available course.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                applyFilters('', '', 'featured');
              }}
              className="mt-6 inline-flex items-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Clear all filters
            </button>
          </section>
        ) : null}

        {!error && visibleCourses.length > 0 ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);

              return (
                <article
                  key={course.id}
                  className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {course.tags.length > 0 ? (
                        course.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            <Tag className="h-3.5 w-3.5" />
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Course
                        </span>
                      )}
                    </div>

                    {isEnrolled ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Enrolled
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{course.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{course.shortDescription}</p>

                    <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        <span>{course.teacherName ?? 'Instructor assigned soon'}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        <span>{formatCourseDuration(course.durationHours)}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        <span>
                          {course.studentsEnrolled != null ? `${course.studentsEnrolled} learners` : 'Open enrollment'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span>{formatCoursePrice(course.price)}</span>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <p className="text-sm text-slate-500">
                      {isEnrolled
                        ? 'You already have access to this course.'
                        : session.role === 'Student'
                          ? 'Open the course page to enroll.'
                          : 'View course details before enrolling.'}
                    </p>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
                    >
                      {isEnrolled ? 'View course' : 'See details'}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </section>
    </main>
  );
}
