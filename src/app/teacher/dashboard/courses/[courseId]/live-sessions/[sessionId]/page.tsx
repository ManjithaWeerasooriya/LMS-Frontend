import LiveClassroomPage from '@/features/live-classroom/pages/LiveClassroomPage';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
}) {
  const { courseId, sessionId } = await params;

  return <LiveClassroomPage role="teacher" courseId={courseId} sessionId={sessionId} />;
}
