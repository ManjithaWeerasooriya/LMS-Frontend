'use client';

import { useEffect, useState } from 'react';

import {
  enrollInCourse,
  getAvailableStudentCourses,
  type StudentCourse,
} from '@/lib/student';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableStudentCourses(searchTerm);
      setCourses(data);
    } catch {
      setError('Unable to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadCourses(search);
  };

  const handleEnrollClick = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      setError(null);
      await enrollInCourse(courseId);
      await loadCourses(search);
    } catch {
      setError('Unable to enroll in this course. Please try again.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Courses</h1>
        <p className="text-sm text-slate-500">Browse available courses</p>
      </section>

      <section className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-xl"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses by title or instructor..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 pl-10 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </span>
        </form>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16l-5.5 7v5l-5 2v-7z" />
            </svg>
          </span>
          Filters
        </button>
      </section>

      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = course.isEnrolled;
            const isBusy = enrollingId === course.id;

            return (
              <article
                key={course.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="h-32 bg-linear-to-br from-blue-500 to-blue-600" />

                <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                      active
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 .587l3.668 7.429 8.2 1.193-5.934 5.788 1.402 8.171L12 18.896l-7.336 3.872 1.402-8.171L.132 9.209l8.2-1.193z" />
                      </svg>
                      {typeof course.rating === 'number' ? (
                        <span className="font-semibold text-slate-900">
                          {course.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {course.instructorName}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {course.studentsEnrolled} students
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${course.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isEnrolled || isBusy}
                    onClick={() => handleEnrollClick(course.id)}
                    className={`mt-3 inline-flex items-center justify-center rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${
                      isEnrolled
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-[#1B3B8B] hover:bg-[#163170]'
                    }`}
                  >
                    {isEnrolled
                      ? 'Enrolled'
                      : isBusy
                        ? 'Enrolling...'
                        : 'Enroll Now'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

