import Link from 'next/link';

import { Course, getCourses } from '@/lib/courses';

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search || '';
  const courses = await getCourses(search);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.35em] text-blue-600">Explore</p>
        <h1 className="text-4xl font-bold text-gray-900">Courses</h1>
        <p className="mt-2 text-gray-600">
          Browse curated classes to sharpen your skills and accelerate your learning.
        </p>
      </header>

      <form className="mb-10">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search courses..."
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: Course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50/60 hover:shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] text-blue-700">
                {course.category || 'Featured'}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-blue-900">
              {course.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {course.description}
            </p>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-10 text-center text-gray-600">No courses found.</p>
      )}
    </main>
  );
}
