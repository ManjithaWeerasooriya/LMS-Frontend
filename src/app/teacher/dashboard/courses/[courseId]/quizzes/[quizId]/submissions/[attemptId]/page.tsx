import TeacherQuizAttemptReviewPage from '@/features/teacher/quizzes/pages/TeacherQuizAttemptReviewPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string; attemptId: string }>;
}) {
  const { courseId, quizId, attemptId } = await params;

  return (
    <TeacherQuizAttemptReviewPage
      courseId={courseId}
      quizId={quizId}
      attemptId={attemptId}
    />
  );
}
