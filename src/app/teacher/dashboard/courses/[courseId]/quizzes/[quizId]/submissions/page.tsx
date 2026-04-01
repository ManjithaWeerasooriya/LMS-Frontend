import TeacherQuizSubmissionsPage from '@/features/teacher/quizzes/pages/TeacherQuizSubmissionsPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;

  return <TeacherQuizSubmissionsPage courseId={courseId} quizId={quizId} />;
}
