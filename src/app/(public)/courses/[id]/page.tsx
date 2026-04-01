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
    return <p className="p-6 text-gray-800">Course not found</p>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

      <p className="mt-4 text-gray-800 leading-relaxed">{course.description}</p>

      <div className="mt-6 space-y-2 text-gray-700">
        <p>
          <span className="font-medium text-gray-800">Category:</span>{" "}
          <span className="text-gray-600">{course.category}</span>
        </p>
        <p>
          <span className="font-medium text-gray-800">Price:</span>{" "}
          <span className="text-gray-600">${course.price}</span>
        </p>
        <p>
          <span className="font-medium text-gray-800">Duration:</span>{" "}
          <span className="text-gray-600">{course.durationHours} hours</span>
        </p>
        <p>
          <span className="font-medium text-gray-800">Teacher:</span>{" "}
          <span className="text-gray-600">{course.teacherName}</span>
        </p>
      </div>

      <Link
        href="/login"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium shadow-sm transition hover:bg-blue-700"
      >
        Enroll Now
      </Link>
    </main>
  );
}
