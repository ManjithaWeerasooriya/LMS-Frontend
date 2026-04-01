import { CourseDetailClient } from '@/features/public/courses/components/CourseDetailClient';
import { getCourseById } from '@/lib/courses';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { course, error } = await getCourseById(id);

  return <CourseDetailClient course={course} error={error} />;
}
