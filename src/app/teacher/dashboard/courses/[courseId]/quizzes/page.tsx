import TeacherCourseQuizzesPage from '@/features/teacher/quizzes/pages/TeacherCourseQuizzesPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <TeacherCourseQuizzesPage courseId={courseId} />;
}
