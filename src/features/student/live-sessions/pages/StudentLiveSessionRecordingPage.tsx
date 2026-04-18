'use client';

import Link from 'next/link';
import { ExternalLink, PlayCircle, Video } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  getLiveClassroomErrorMessage,
  getStudentLiveSessionRecording,
  type LiveSessionRecording,
} from '@/features/live-classroom/api';
import {
  LIVE_CLASSROOM_RECORDING_STATUS,
  formatDurationLabel,
  formatLiveClassroomDateTime,
  getRecordingStatusMeta,
} from '@/features/live-classroom/utils';
import {
  getStudentLiveSessionById,
  getStudentLiveSessionErrorMessage,
  type StudentLiveSession,
} from '@/features/student/live-sessions/api';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type StudentLiveSessionRecordingPageProps = {
  courseId: string;
  sessionId: string;
};

const getRecordingUnavailableMessage = (
  session: StudentLiveSession | null,
  recording: LiveSessionRecording | null,
  fallback: string | null,
) => {
  if (fallback) {
    return fallback;
  }

  if (!session?.recordingEnabled) {
    return 'This live session was not configured for recording.';
  }

  if (!recording?.playbackEnabled) {
    return 'Playback has not been enabled for this recording yet.';
  }

  if (recording.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.inProgress) {
    return 'The recording is still being processed. Check back again shortly.';
  }

  if (recording.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.failed) {
    return 'Recording processing failed for this session.';
  }

  return 'Recording not available for this session yet.';
};

export default function StudentLiveSessionRecordingPage({
  courseId,
  sessionId,
}: StudentLiveSessionRecordingPageProps) {
  const [session, setSession] = useState<StudentLiveSession | null>(null);
  const [recording, setRecording] = useState<LiveSessionRecording | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isRecordingLoading, setIsRecordingLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const backHref = `/student/dashboard/courses/${courseId}`;
  const classroomHref = `${backHref}/live-sessions/${sessionId}`;

  const loadSession = useCallback(async () => {
    setIsSessionLoading(true);
    setSessionError(null);

    try {
      const nextSession = await getStudentLiveSessionById(sessionId);
      if (nextSession.courseId && nextSession.courseId !== courseId) {
        throw new Error('This recording does not belong to the selected course.');
      }
      setSession(nextSession);
    } catch (loadError) {
      setSessionError(
        getStudentLiveSessionErrorMessage(loadError, 'Unable to load this recording page.'),
      );
    } finally {
      setIsSessionLoading(false);
    }
  }, [courseId, sessionId]);

  const loadRecording = useCallback(async () => {
    setIsRecordingLoading(true);
    setRecordingError(null);

    try {
      const nextRecording = await getStudentLiveSessionRecording(sessionId);
      setRecording(nextRecording);
    } catch (loadError) {
      setRecording(null);
      setRecordingError(
        getLiveClassroomErrorMessage(
          loadError,
          'Recording not available for this session yet.',
        ),
      );
    } finally {
      setIsRecordingLoading(false);
    }
  }, [sessionId]);

  const refreshPage = useCallback(async () => {
    await Promise.all([loadSession(), loadRecording()]);
  }, [loadRecording, loadSession]);

  useEffect(() => {
    void refreshPage();
  }, [refreshPage]);

  const playbackAvailable = Boolean(
    recording?.playbackEnabled &&
      recording.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.available &&
      recording.recordingUrl,
  );

  const recordingStatus = recording
    ? getRecordingStatusMeta(recording.recordingStatus)
    : session
      ? getRecordingStatusMeta(session.recordingStatus)
      : null;

  const unavailableMessage = useMemo(
    () => getRecordingUnavailableMessage(session, recording, recordingError),
    [recording, recordingError, session],
  );

  const title = session?.title ?? recording?.sessionTitle ?? 'Session recording';
  const courseTitle = session?.courseTitle ?? recording?.courseTitle ?? 'Course';
  const headerActions = [
    ...(session
      ? [
          {
            label: 'Open Classroom',
            href: classroomHref,
            variant: 'secondary' as const,
          },
        ]
      : []),
    {
      label: 'Refresh',
      onClick: () => void refreshPage(),
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Recording Playback"
        title={isSessionLoading && !session ? 'Loading recording…' : title}
        description="Open the playback page for a recorded live session and review availability from the student recording endpoint."
        backHref={backHref}
        actions={headerActions}
      >
        <BreadcrumbTrail
          items={[
            { label: 'My Courses', href: '/student/dashboard/courses' },
            { label: courseTitle, href: backHref },
            { label: title },
            { label: 'Recording' },
          ]}
        />
      </QuizPageHeader>

      <ErrorAlert message={sessionError ?? ''} />

      {isSessionLoading && !session ? (
        <QuizStatePanel
          title="Loading recording"
          message="Fetching the session details and recording metadata."
        />
      ) : !session && sessionError ? (
        <QuizStatePanel
          title="Recording unavailable"
          message="This recording page could not be loaded. Return to the course page and try again."
          tone="error"
          action={
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
            >
              Back to course
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <QuizMetricCard label="Session" value={title} hint={courseTitle} />
            <QuizMetricCard
              label="Recorded On"
              value={session ? formatLiveClassroomDateTime(session.startTime) : '—'}
              hint={session ? formatDurationLabel(session.durationMinutes) : undefined}
            />
            <QuizMetricCard
              label="Recording Status"
              value={recordingStatus?.label ?? '—'}
              hint={recording?.playbackEnabled ? 'Playback enabled' : 'Playback unavailable'}
            />
          </div>

          <QuizSectionCard
            title="Playback"
            description="Play back the session recording when the backend marks it available."
          >
            {isRecordingLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Loading recording playback…
              </div>
            ) : playbackAvailable && recording?.recordingUrl ? (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm">
                  <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-slate-950"
                    src={recording.recordingUrl}
                  >
                    Your browser does not support embedded video playback.
                  </video>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={recording.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </a>
                  {recording.recordingStoppedAt ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Processed {formatLiveClassroomDateTime(recording.recordingStoppedAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                  {recording?.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.inProgress ? (
                    <PlayCircle className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Recording not available
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{unavailableMessage}</p>
              </div>
            )}
          </QuizSectionCard>
        </>
      )}
    </div>
  );
}
