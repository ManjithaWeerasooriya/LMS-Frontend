import TeacherQuizEditorPage from '@/features/teacher/quizzes/pages/TeacherQuizEditorPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;

  return <TeacherQuizEditorPage mode="edit" courseId={courseId} quizId={quizId} />;
}
