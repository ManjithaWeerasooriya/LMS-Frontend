import StudentLiveSessionRecordingPage from '@/features/student/live-sessions/pages/StudentLiveSessionRecordingPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
}) {
  const { courseId, sessionId } = await params;

  return <StudentLiveSessionRecordingPage courseId={courseId} sessionId={sessionId} />;
}
