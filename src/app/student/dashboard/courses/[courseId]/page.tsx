import StudentCourseDetailPage from '@/features/student/courses/pages/StudentCourseDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <StudentCourseDetailPage courseId={courseId} />;
}
