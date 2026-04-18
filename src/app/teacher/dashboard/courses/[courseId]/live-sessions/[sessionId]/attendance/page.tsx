import TeacherLiveSessionAttendancePage from '@/features/teacher/live-sessions/pages/TeacherLiveSessionAttendancePage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
}) {
  const { courseId, sessionId } = await params;

  return <TeacherLiveSessionAttendancePage courseId={courseId} sessionId={sessionId} />;
}
