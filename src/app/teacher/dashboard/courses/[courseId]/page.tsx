import TeacherCourseManagementPage from '@/features/teacher/pages/TeacherCourseManagementPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <TeacherCourseManagementPage courseId={courseId} />;
}
