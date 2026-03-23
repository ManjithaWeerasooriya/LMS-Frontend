import { Course, getCourses } from "@/lib/courses";
import Link from "next/link";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search || "";
  const courses = await getCourses(search);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Courses</h1>

      <form className="mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search courses..."
          className="w-full rounded border p-2"
        />
      </form>

      <div className="grid gap-4">
        {courses.map((course: Course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="rounded border p-4 hover:shadow"
          >
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p className="text-gray-500">{course.description}</p>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-6 text-gray-500">No courses found.</p>
      )}
    </main>
  );
}