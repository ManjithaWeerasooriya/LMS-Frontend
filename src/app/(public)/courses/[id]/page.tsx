import { getCourseById } from "@/lib/courses";
import Link from "next/link";

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return <p className="p-6">Course not found</p>;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{course.title}</h1>

      <p className="mt-4 text-gray-600">{course.description}</p>

      <div className="mt-6 space-y-2">
        <p>Category: {course.category}</p>
        <p>Price: ${course.price}</p>
        <p>Duration: {course.durationHours} hours</p>
        <p>Teacher: {course.teacherName}</p>
      </div>

      {/* Enroll button */}
      <div className="mt-8">
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Enroll Now
        </Link>
      </div>
    </main>
  );
}
