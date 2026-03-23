import { getCourses } from "@/lib/courses";
import Link from "next/link";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const search = searchParams?.search || "";
  const courses = await getCourses(search);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Courses</h1>

      {/* Search */}
      <form className="mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search courses..."
          className="border p-2 w-full rounded"
        />
      </form>

      {/* List */}
      <div className="grid gap-4">
        {courses.map((course: any) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="border p-4 rounded hover:shadow"
          >
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p className="text-gray-500">{course.description}</p>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <p className="text-gray-500 mt-6">No courses found.</p>
      )}
    </main>
  );
}