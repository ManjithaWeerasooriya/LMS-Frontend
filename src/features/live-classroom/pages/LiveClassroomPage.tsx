'use client';

import Link from 'next/link';
import {
  Camera,
  CameraOff,
  Circle,
  Mic,
  MicOff,
  Radio,
  RefreshCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  createLiveSessionJoinToken,
  endTeacherLiveSessionById,
  getLiveClassroomErrorMessage,
  joinStudentLiveSessionAttendance,
  leaveStudentLiveSessionAttendance,
  startTeacherLiveSessionById,
  startTeacherLiveSessionRecording,
  stopTeacherLiveSessionRecording,
  type LiveSessionRecording,
} from '@/features/live-classroom/api';
import { LiveChatPanel } from '@/features/live-classroom/components/LiveChatPanel';
import { VideoTileSurface } from '@/features/live-classroom/components/VideoTileSurface';
import { useLiveClassroomCall } from '@/features/live-classroom/hooks/useLiveClassroomCall';
import { useLiveClassroomChat } from '@/features/live-classroom/hooks/useLiveClassroomChat';
import {
  LIVE_CLASSROOM_RECORDING_STATUS,
  LIVE_CLASSROOM_STATUS,
  formatDurationLabel,
  formatLiveClassroomDateTime,
  formatLiveClassroomTimeRange,
  getLiveClassroomStatusMeta,
  getRecordingStatusMeta,
} from '@/features/live-classroom/utils';
import {
  getStudentLiveSessionById,
  getStudentLiveSessionErrorMessage,
  type StudentLiveSession,
} from '@/features/student/live-sessions/api';
import {
  getLiveSessionErrorMessage as getTeacherSessionErrorMessage,
  getTeacherLiveSessionById,
  type TeacherLiveSession,
} from '@/features/teacher/live-sessions/api';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type LiveClassroomRole = 'teacher' | 'student';

type LiveClassroomPageProps = {
  role: LiveClassroomRole;
  courseId: string;
  sessionId: string;
};

type LiveClassroomSession = TeacherLiveSession | StudentLiveSession;

const SESSION_POLL_INTERVAL_MS = 20_000;

const getBackHref = (role: LiveClassroomRole, courseId: string) =>
  role === 'teacher'
    ? `/teacher/dashboard/courses/${courseId}`
    : `/student/dashboard/courses/${courseId}`;

const getRoleLabel = (role: LiveClassroomRole) =>
  role === 'teacher' ? 'Teacher Classroom' : 'Student Classroom';

const getConnectionLabel = ({
  isTokenLoading,
  isJoining,
  isConnected,
  isReconnecting,
}: {
  isTokenLoading: boolean;
  isJoining: boolean;
  isConnected: boolean;
  isReconnecting: boolean;
}) => {
  if (isTokenLoading) {
    return 'Securing access';
  }

  if (isJoining) {
    return 'Joining';
  }

  if (isReconnecting) {
    return 'Reconnecting';
  }

  if (isConnected) {
    return 'Connected';
  }

  return 'Standby';
};

export default function LiveClassroomPage({
  role,
  courseId,
  sessionId,
}: LiveClassroomPageProps) {
  const [session, setSession] = useState<LiveClassroomSession | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [joinToken, setJoinToken] = useState<Awaited<
    ReturnType<typeof createLiveSessionJoinToken>
  > | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0);

  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isRecordingActionLoading, setIsRecordingActionLoading] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [pageActionError, setPageActionError] = useState<string | null>(null);

  const [hasAttendanceJoined, setHasAttendanceJoined] = useState(false);

  const call = useLiveClassroomCall({ joinToken, autoPrepareLocalPreview: false });
  const chat = useLiveClassroomChat({ joinToken });

  const loadSession = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsSessionLoading(true);
      }

      try {
        const nextSession =
          role === 'teacher'
            ? await getTeacherLiveSessionById(courseId, sessionId)
            : await getStudentLiveSessionById(sessionId);

        if (nextSession.courseId && nextSession.courseId !== courseId) {
          throw new Error('This live session is not part of the selected course.');
        }

        setSession(nextSession);
        setSessionError(null);
      } catch (loadError) {
        const message =
          role === 'teacher'
            ? getTeacherSessionErrorMessage(loadError, 'Unable to load the live classroom.')
            : getStudentLiveSessionErrorMessage(loadError, 'Unable to load the live classroom.');

        setSessionError(message);
      } finally {
        if (!options?.silent) {
          setIsSessionLoading(false);
        }
      }
    },
    [courseId, role, sessionId],
  );

  const loadJoinToken = useCallback(async () => {
    setIsTokenLoading(true);
    setTokenError(null);

    try {
      const token = await createLiveSessionJoinToken(sessionId);
      setJoinToken(token);
    } catch (loadError) {
      setJoinToken(null);
      setTokenError(
        getLiveClassroomErrorMessage(
          loadError,
          'Unable to prepare secure ACS access for this classroom.',
        ),
      );
    } finally {
      setIsTokenLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    void loadJoinToken();
  }, [loadJoinToken, tokenRefreshKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadSession({ silent: true });
    }, SESSION_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadSession]);

  useEffect(() => {
    return () => {
      if (role === 'student' && hasAttendanceJoined) {
        void leaveStudentLiveSessionAttendance(sessionId).catch(() => undefined);
      }
    };
  }, [hasAttendanceJoined, role, sessionId]);

  const handlePreparePreview = useCallback(async () => {
    setIsPreparingPreview(true);
    setPageActionError(null);

    try {
      await call.prepareLocalPreview();
    } catch (previewError) {
      setPageActionError(
        getLiveClassroomErrorMessage(
          previewError,
          'Unable to prepare the local classroom preview.',
        ),
      );
    } finally {
      setIsPreparingPreview(false);
    }
  }, [call]);

  const refreshSession = useCallback(async () => {
    await loadSession();
    setTokenRefreshKey((current) => current + 1);
  }, [loadSession]);

  const handleTeacherGoLive = useCallback(async () => {
    setIsStartingSession(true);
    setPageActionError(null);

    try {
      await startTeacherLiveSessionById(sessionId);
      const joined = await call.joinCall({ withVideo: true, startMuted: false });
      await loadSession({ silent: true });

      if (!joined) {
        setPageActionError('The session started, but the classroom connection did not open.');
      }
    } catch (startError) {
      setPageActionError(
        getLiveClassroomErrorMessage(startError, 'Unable to start the live session.'),
      );
    } finally {
      setIsStartingSession(false);
    }
  }, [call, loadSession, sessionId]);

  const handleTeacherJoinLiveRoom = useCallback(async () => {
    setIsStartingSession(true);
    setPageActionError(null);

    try {
      const joined = await call.joinCall({ withVideo: true, startMuted: false });
      await loadSession({ silent: true });

      if (!joined) {
        setPageActionError('Unable to reconnect to the live classroom.');
      }
    } catch (joinError) {
      setPageActionError(
        getLiveClassroomErrorMessage(joinError, 'Unable to reconnect to the live classroom.'),
      );
    } finally {
      setIsStartingSession(false);
    }
  }, [call, loadSession]);

  const handleTeacherEndSession = useCallback(async () => {
    setIsEndingSession(true);
    setPageActionError(null);

    try {
      await endTeacherLiveSessionById(sessionId);
      await call.leaveCall();
      await loadSession({ silent: true });
    } catch (endError) {
      setPageActionError(
        getLiveClassroomErrorMessage(endError, 'Unable to end the live session.'),
      );
    } finally {
      setIsEndingSession(false);
    }
  }, [call, loadSession, sessionId]);

  const applyRecordingUpdate = useCallback((recording: LiveSessionRecording) => {
    setSession((current) =>
      current
        ? {
            ...current,
            playbackEnabled: recording.playbackEnabled,
            acsRecordingId: recording.acsRecordingId,
            recordingStatus: recording.recordingStatus,
            recordingUrl: recording.recordingUrl,
            recordingStartedAt: recording.recordingStartedAt,
            recordingStoppedAt: recording.recordingStoppedAt,
          }
        : current,
    );
  }, []);

  const handleTeacherRecordingAction = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsRecordingActionLoading(true);
    setPageActionError(null);

    try {
      const recording =
        session.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.inProgress
          ? await stopTeacherLiveSessionRecording(sessionId)
          : await startTeacherLiveSessionRecording(sessionId);

      applyRecordingUpdate(recording);
      await loadSession({ silent: true });
    } catch (recordingError) {
      setPageActionError(
        getLiveClassroomErrorMessage(
          recordingError,
          'Unable to update the recording state for this classroom.',
        ),
      );
    } finally {
      setIsRecordingActionLoading(false);
    }
  }, [applyRecordingUpdate, loadSession, session, sessionId]);

  const handleStudentJoin = useCallback(async () => {
    setPageActionError(null);

    const joined = await call.joinCall({ withVideo: false, startMuted: true });
    if (!joined) {
      setPageActionError('Unable to join the classroom right now.');
      return;
    }

    try {
      await joinStudentLiveSessionAttendance(sessionId);
      setHasAttendanceJoined(true);
      await loadSession({ silent: true });
    } catch (attendanceJoinError) {
      setPageActionError(
        getLiveClassroomErrorMessage(
          attendanceJoinError,
          'Joined the classroom, but attendance could not be recorded.',
        ),
      );
    }
  }, [call, loadSession, sessionId]);

  const handleStudentLeave = useCallback(async () => {
    setPageActionError(null);

    try {
      await call.leaveCall();
      if (hasAttendanceJoined) {
        await leaveStudentLiveSessionAttendance(sessionId);
      }
      setHasAttendanceJoined(false);
      await loadSession({ silent: true });
    } catch (attendanceLeaveError) {
      setPageActionError(
        getLiveClassroomErrorMessage(
          attendanceLeaveError,
          'Unable to close the classroom session cleanly.',
        ),
      );
    }
  }, [call, hasAttendanceJoined, loadSession, sessionId]);

  const backHref = getBackHref(role, courseId);
  const attendanceHref = `/teacher/dashboard/courses/${courseId}/live-sessions/${sessionId}/attendance`;
  const sessionStatus = session ? getLiveClassroomStatusMeta(session.status) : null;
  const recordingStatus = session ? getRecordingStatusMeta(session.recordingStatus) : null;
  const connectionLabel = getConnectionLabel({
    isTokenLoading,
    isJoining: call.isJoining,
    isConnected: call.isConnected,
    isReconnecting: call.isReconnecting,
  });

  const isStudentJoinDisabled =
    !session ||
    session.status !== LIVE_CLASSROOM_STATUS.live ||
    isTokenLoading ||
    !call.supportsJoining ||
    call.isJoining;

  const teacherControlDisabled =
    !session || isTokenLoading || !call.supportsJoining || isStartingSession;

  const primaryRemoteTile = call.remoteTiles[0] ?? null;
  const additionalRemoteTiles = call.remoteTiles.slice(1);

  const classroomSummary = useMemo(() => {
    if (!session) {
      return {
        title: 'Live classroom',
        description: 'Loading session details…',
      };
    }

    if (role === 'teacher') {
      return {
        title: session.title,
        description:
          session.description?.trim() ||
          'Start the broadcast, manage recording, and review attendance from this classroom.',
      };
    }

    return {
      title: session.title,
      description:
        session.description?.trim() ||
        'Join the live classroom, follow the teacher stream, and stay connected through chat.',
    };
  }, [role, session]);

  const roleActions =
    role === 'teacher' ? (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            void (
              session?.status === LIVE_CLASSROOM_STATUS.live
                ? handleTeacherJoinLiveRoom()
                : handleTeacherGoLive()
            )
          }
          disabled={
            teacherControlDisabled ||
            session?.status === LIVE_CLASSROOM_STATUS.ended ||
            session?.status === LIVE_CLASSROOM_STATUS.cancelled ||
            (session?.status === LIVE_CLASSROOM_STATUS.live && call.isConnected)
          }
          className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isStartingSession
            ? session?.status === LIVE_CLASSROOM_STATUS.live
              ? 'Joining…'
              : 'Starting…'
            : session?.status === LIVE_CLASSROOM_STATUS.live
              ? call.isConnected
                ? 'Live now'
                : 'Join live room'
              : 'Go live'}
        </button>
        <button
          type="button"
          onClick={() => void handleTeacherEndSession()}
          disabled={
            isEndingSession ||
            !session ||
            session.status !== LIVE_CLASSROOM_STATUS.live
          }
          className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEndingSession ? 'Ending…' : 'End session'}
        </button>
        <button
          type="button"
          onClick={() => void handleTeacherRecordingAction()}
          disabled={
            isRecordingActionLoading ||
            !session?.recordingEnabled ||
            session.status !== LIVE_CLASSROOM_STATUS.live
          }
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRecordingActionLoading
            ? 'Updating recording…'
            : session?.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.inProgress
              ? 'Stop recording'
              : 'Start recording'}
        </button>
        <Link
          href={attendanceHref}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Attendance
        </Link>
      </div>
    ) : (
      <div className="flex flex-wrap gap-3">
        {call.isConnected ? (
          <button
            type="button"
            onClick={() => void handleStudentLeave()}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Leave classroom
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStudentJoin()}
            disabled={isStudentJoinDisabled}
            className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {call.isJoining ? 'Joining…' : 'Join session'}
          </button>
        )}
      </div>
    );

  return (
    <>
      <div className="space-y-6">
        <QuizPageHeader
          eyebrow={getRoleLabel(role)}
          title={isSessionLoading && !session ? 'Loading classroom…' : classroomSummary.title}
          description={classroomSummary.description}
          backHref={backHref}
          actions={[
            {
              label: 'Refresh',
              onClick: () => void refreshSession(),
              variant: 'secondary',
            },
          ]}
        >
          <BreadcrumbTrail
            items={[
              {
                label: role === 'teacher' ? 'Courses' : 'My Courses',
                href: role === 'teacher' ? '/teacher/dashboard/courses' : '/student/dashboard/courses',
              },
              {
                label: session?.courseTitle ?? 'Course',
                href: backHref,
              },
              {
                label: 'Live classroom',
              },
            ]}
          />
        </QuizPageHeader>

        <ErrorAlert message={sessionError ?? ''} />
        <ErrorAlert message={tokenError ?? ''} />
        <ErrorAlert message={pageActionError ?? ''} />
        <ErrorAlert message={call.error ?? ''} />

        {call.isReconnecting ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The classroom connection dropped and is reconnecting.
          </div>
        ) : null}

        {isSessionLoading && !session ? (
          <QuizStatePanel
            title="Loading classroom"
            message="Fetching session details and secure ACS access for this classroom."
          />
        ) : !session ? (
          <QuizStatePanel
            title="Classroom unavailable"
            message="This live classroom could not be loaded. Return to the course page and try again."
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <QuizMetricCard
                  label="Status"
                  value={sessionStatus?.label ?? '—'}
                  hint={session ? formatLiveClassroomDateTime(session.startTime) : undefined}
                />
                <QuizMetricCard
                  label="Timing"
                  value={formatLiveClassroomTimeRange(
                    session.startTime,
                    session.durationMinutes,
                  )}
                  hint={formatDurationLabel(session.durationMinutes)}
                />
                <QuizMetricCard
                  label="Classroom"
                  value={connectionLabel}
                  hint={
                    recordingStatus
                      ? `${recordingStatus.label} · ${session.recordingEnabled ? 'Recording enabled' : 'Recording disabled'}`
                      : undefined
                  }
                />
              </div>

              <QuizSectionCard
                title="Session Overview"
                description="Review the live session state, secure connection, and role-specific actions."
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sessionStatus?.className ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {sessionStatus?.label ?? 'Unknown'}
                        </span>
                        {recordingStatus ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${recordingStatus.className}`}
                          >
                            {recordingStatus.label}
                          </span>
                        ) : null}
                        {session.teacherName ? (
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {session.teacherName}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {session.description?.trim() || 'No session description provided.'}
                      </p>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Start
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatLiveClassroomDateTime(session.startTime)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Duration
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatDurationLabel(session.durationMinutes)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!call.supportsJoining ? (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                        This classroom does not have a valid ACS room configured yet. The backend
                        must provide room-based join data before anyone can join.
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Circle
                          className={`h-3.5 w-3.5 ${
                            session.status === LIVE_CLASSROOM_STATUS.live
                              ? 'fill-rose-500 text-rose-500'
                              : 'fill-slate-300 text-slate-300'
                          }`}
                        />
                        {role === 'teacher'
                          ? 'Teacher controls'
                          : 'Student join controls'}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {role === 'teacher'
                          ? 'Go live when you are ready, manage recording, and monitor attendance.'
                          : session.status === LIVE_CLASSROOM_STATUS.live
                            ? 'The session is live. Join the classroom to watch the teacher stream.'
                            : 'You can open the classroom page now and join once the teacher goes live.'}
                      </p>

                      <div className="mt-5">{roleActions}</div>

                      {role === 'teacher' ? (
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => void handlePreparePreview()}
                            disabled={isPreparingPreview || isTokenLoading || !call.supportsJoining}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCcw
                              className={`h-4 w-4 ${isPreparingPreview ? 'animate-spin' : ''}`}
                            />
                            {call.localPreview ? 'Refresh preview' : 'Prepare preview'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void call.toggleMicrophone()}
                            disabled={!call.isConnected}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {call.isMuted ? (
                              <MicOff className="h-4 w-4" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                            {call.isMuted ? 'Unmute' : 'Mute'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void call.toggleCamera()}
                            disabled={!call.localPreview && !call.isConnected && isTokenLoading}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {call.isCameraOn ? (
                              <Camera className="h-4 w-4" />
                            ) : (
                              <CameraOff className="h-4 w-4" />
                            )}
                            {call.isCameraOn ? 'Camera on' : 'Camera off'}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Secure access
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {isTokenLoading ? 'Fetching secure ACS token…' : 'ACS token ready'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        The page only uses the backend token endpoint and does not embed ACS secrets in
                        the frontend.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTokenRefreshKey((current) => current + 1)}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh token
                      </button>
                    </div>
                  </div>
                </div>
              </QuizSectionCard>

              <QuizSectionCard
                title="Classroom Stage"
                description={
                  role === 'teacher'
                    ? 'Local preview stays on the right while connected participants appear on the main stage.'
                    : 'Join the classroom to watch the teacher stream and follow the live delivery.'
                }
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                  <VideoTileSurface
                    tile={primaryRemoteTile}
                    title={role === 'teacher' ? 'Live stage' : 'Teacher stream'}
                    emptyTitle={
                      role === 'teacher'
                        ? 'Waiting for participants'
                        : session.status === LIVE_CLASSROOM_STATUS.live
                          ? 'Waiting for the teacher video'
                          : 'Session not live yet'
                    }
                    emptyMessage={
                      role === 'teacher'
                        ? 'Student video will appear here when participants join with their cameras enabled.'
                        : session.status === LIVE_CLASSROOM_STATUS.live
                          ? 'The classroom is live, but the teacher video stream is not available yet.'
                          : 'The teacher has not gone live yet. Keep this page open and watch the status update.'
                    }
                  />

                  <div className="space-y-4">
                    {role === 'teacher' ? (
                      <VideoTileSurface
                        tile={call.localPreview}
                        title="Local preview"
                        emptyTitle="Preview unavailable"
                        emptyMessage="Prepare the preview to confirm your camera framing before going live."
                      />
                    ) : (
                      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Radio className="h-4 w-4 text-blue-700" />
                          Live status
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          {session.status === LIVE_CLASSROOM_STATUS.live
                            ? 'The teacher is currently live. Join the classroom to watch the stream and participate in chat.'
                            : session.status === LIVE_CLASSROOM_STATUS.scheduled
                              ? 'This session is scheduled. You can stay on this page and join as soon as it turns live.'
                              : session.status === LIVE_CLASSROOM_STATUS.ended
                                ? 'This session has ended.'
                                : 'This session has been cancelled.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {additionalRemoteTiles.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {additionalRemoteTiles.map((tile) => (
                      <VideoTileSurface
                        key={tile.id}
                        tile={tile}
                        title={tile.displayName}
                        emptyTitle="Stream unavailable"
                        emptyMessage="This participant does not have an active video stream."
                        className="shadow-none"
                      />
                    ))}
                  </div>
                ) : null}
              </QuizSectionCard>
            </div>

            <LiveChatPanel
              messages={chat.messages}
              isLoading={chat.isInitializing}
              isSending={chat.isSending}
              supportsChat={chat.supportsChat}
              connectionState={chat.connectionState}
              error={chat.error}
              onClearError={chat.clearError}
              onSendMessage={chat.sendMessage}
            />
          </div>
        )}
      </div>
    </>
  );
}
