import StudentQuizAttemptPage from '@/features/student/quizzes/pages/StudentQuizAttemptPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;

  return <StudentQuizAttemptPage courseId={courseId} quizId={quizId} />;
}
