import TeacherQuizEditorPage from '@/features/teacher/quizzes/pages/TeacherQuizEditorPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <TeacherQuizEditorPage mode="create" courseId={courseId} />;
}
