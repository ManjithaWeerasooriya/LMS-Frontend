import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LiveClassroomPage from '@/features/live-classroom/pages/LiveClassroomPage';
import { LIVE_CLASSROOM_RECORDING_STATUS, LIVE_CLASSROOM_STATUS } from '@/features/live-classroom/utils';
import type { TeacherLiveSession } from '@/features/teacher/live-sessions/api';
import type { StudentLiveSession } from '@/features/student/live-sessions/api';

const mockState = vi.hoisted(() => ({
  createLiveSessionJoinToken: vi.fn(),
  startTeacherLiveSessionById: vi.fn(),
  endTeacherLiveSessionById: vi.fn(),
  startTeacherLiveSessionRecording: vi.fn(),
  stopTeacherLiveSessionRecording: vi.fn(),
  joinStudentLiveSessionAttendance: vi.fn(),
  leaveStudentLiveSessionAttendance: vi.fn(),
  getTeacherLiveSessionById: vi.fn(),
  getStudentLiveSessionById: vi.fn(),
  call: {
    isInitializing: false,
    isJoining: false,
    callState: 'idle' as const,
    isConnected: false,
    isReconnecting: false,
    localPreview: {
      id: 'local-preview',
      participantId: 'local-preview',
      displayName: 'Local preview',
      target: document.createElement('div'),
      mediaStreamType: 'Video',
      isReceiving: true,
    },
    remoteTiles: [],
    isMuted: false,
    isCameraOn: true,
    supportsJoining: true,
    error: null,
    clearError: vi.fn(),
    prepareLocalPreview: vi.fn(),
    joinCall: vi.fn(async () => true),
    leaveCall: vi.fn(),
    toggleMicrophone: vi.fn(),
    toggleCamera: vi.fn(),
  },
}));

vi.mock('@/features/live-classroom/api', () => ({
  createLiveSessionJoinToken: mockState.createLiveSessionJoinToken,
  endTeacherLiveSessionById: mockState.endTeacherLiveSessionById,
  getLiveClassroomErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback,
  joinStudentLiveSessionAttendance: mockState.joinStudentLiveSessionAttendance,
  leaveStudentLiveSessionAttendance: mockState.leaveStudentLiveSessionAttendance,
  startTeacherLiveSessionById: mockState.startTeacherLiveSessionById,
  startTeacherLiveSessionRecording: mockState.startTeacherLiveSessionRecording,
  stopTeacherLiveSessionRecording: mockState.stopTeacherLiveSessionRecording,
}));

vi.mock('@/features/live-classroom/hooks/useLiveClassroomCall', () => ({
  useLiveClassroomCall: () => mockState.call,
}));

vi.mock('@/features/live-classroom/hooks/useLiveClassroomChat', () => ({
  useLiveClassroomChat: () => ({
    messages: [],
    isInitializing: false,
    isSending: false,
    supportsChat: true,
    connectionState: 'connected',
    error: null,
    clearError: vi.fn(),
    sendMessage: vi.fn(),
  }),
}));

vi.mock('@/features/live-classroom/components/VideoTileSurface', () => ({
  VideoTileSurface: ({
    tile,
    title,
    emptyTitle,
    showFullscreenButton,
  }: {
    tile: { displayName: string } | null;
    title: string;
    emptyTitle: string;
    showFullscreenButton?: boolean;
  }) => (
    <div>{tile ? `${title}${showFullscreenButton ? ' [fullscreen]' : ''}: ${tile.displayName}` : emptyTitle}</div>
  ),
}));

vi.mock('@/features/live-classroom/components/LiveChatPanel', () => ({
  LiveChatPanel: () => <div>Live chat</div>,
}));

vi.mock('@/features/teacher/quizzes/components/QuizShared', () => ({
  BreadcrumbTrail: () => null,
  QuizMetricCard: ({
    label,
    value,
    hint,
  }: {
    label: string;
    value: string;
    hint?: string;
  }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
      {hint ? <span>{hint}</span> : null}
    </div>
  ),
  QuizPageHeader: ({
    title,
    description,
    actions,
    children,
  }: {
    title: string;
    description: string;
    actions?: Array<{ label: string; onClick: () => void }>;
    children?: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {actions?.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
      {children}
    </div>
  ),
  QuizSectionCard: ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  ),
  QuizStatePanel: ({
    title,
    message,
    action,
  }: {
    title: string;
    message: string;
    action?: ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  ),
}));

vi.mock('@/features/teacher/live-sessions/api', () => ({
  getLiveSessionErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback,
  getTeacherLiveSessionById: mockState.getTeacherLiveSessionById,
}));

vi.mock('@/features/student/live-sessions/api', () => ({
  getStudentLiveSessionById: mockState.getStudentLiveSessionById,
  getStudentLiveSessionErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback,
}));

const createTeacherSession = (
  overrides: Partial<TeacherLiveSession> = {},
): TeacherLiveSession => ({
  id: 'session-1',
  courseId: 'course-1',
  courseTitle: 'Advanced English',
  title: 'Broadcast Session',
  description: 'Session description',
  startTime: '2026-04-20T10:00:00Z',
  durationMinutes: 60,
  status: LIVE_CLASSROOM_STATUS.scheduled,
  recordingEnabled: true,
  playbackEnabled: false,
  recordingStatus: LIVE_CLASSROOM_RECORDING_STATUS.notStarted,
  recordingUrl: null,
  recordingStartedAt: null,
  recordingStoppedAt: null,
  teacherName: 'Teacher One',
  roomId: 'room-1',
  chatThreadId: 'thread-1',
  ...overrides,
});

const createStudentSession = (
  overrides: Partial<StudentLiveSession> = {},
): StudentLiveSession => ({
  id: 'session-1',
  courseId: 'course-1',
  courseTitle: 'Advanced English',
  title: 'Broadcast Session',
  description: 'Session description',
  startTime: '2026-04-20T10:00:00Z',
  durationMinutes: 60,
  status: LIVE_CLASSROOM_STATUS.live,
  recordingEnabled: true,
  playbackEnabled: false,
  recordingStatus: LIVE_CLASSROOM_RECORDING_STATUS.notStarted,
  recordingUrl: null,
  recordingStartedAt: null,
  recordingStoppedAt: null,
  teacherName: 'Teacher One',
  acsRoomId: 'room-1',
  chatThreadId: 'thread-1',
  ...overrides,
});

describe('LiveClassroomPage teacher live state', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockState.call.isConnected = false;
    mockState.call.remoteTiles = [];
    mockState.call.localPreview = {
      id: 'local-preview',
      participantId: 'local-preview',
      displayName: 'Local preview',
      target: document.createElement('div'),
      mediaStreamType: 'Video',
      isReceiving: true,
    };

    mockState.createLiveSessionJoinToken.mockResolvedValue({
      acsUserId: '8:acs:test-user',
      token: 'token',
      displayName: 'Teacher One',
      acsEndpoint: 'https://example.communication.azure.com',
      roomId: 'room-1',
      chatThreadId: 'thread-1',
      session: {
        id: 'session-1',
        courseId: 'course-1',
        courseTitle: 'Advanced English',
        title: 'Broadcast Session',
        startTime: '2026-04-20T10:00:00Z',
        durationMinutes: 60,
        status: LIVE_CLASSROOM_STATUS.scheduled,
      },
    });
  });

  it('shows the local preview before the teacher goes live', async () => {
    mockState.getTeacherLiveSessionById.mockResolvedValue(createTeacherSession());

    render(<LiveClassroomPage role="teacher" courseId="course-1" sessionId="session-1" />);

    expect(await screen.findByText('Local preview: Local preview')).toBeInTheDocument();
    expect(screen.queryByText(/broadcast is live/i)).not.toBeInTheDocument();
  });

  it('moves the teacher video onto the live stage after go live succeeds', async () => {
    mockState.getTeacherLiveSessionById
      .mockResolvedValueOnce(createTeacherSession())
      .mockResolvedValueOnce(
        createTeacherSession({
          status: LIVE_CLASSROOM_STATUS.live,
        }),
      );
    mockState.startTeacherLiveSessionById.mockResolvedValue({});
    mockState.call.joinCall.mockImplementationOnce(async () => {
      mockState.call.isConnected = true;
      return true;
    });

    render(<LiveClassroomPage role="teacher" courseId="course-1" sessionId="session-1" />);

    await screen.findByText('Local preview: Local preview');
    await userEvent.click(screen.getByRole('button', { name: /go live/i }));

    await waitFor(() => {
      expect(mockState.startTeacherLiveSessionById).toHaveBeenCalledWith('session-1');
      expect(mockState.call.joinCall).toHaveBeenCalledWith({
        withVideo: true,
        startMuted: false,
      });
      expect(screen.queryByText('Local preview: Local preview')).not.toBeInTheDocument();
      expect(screen.getByText('Live stage: Local preview')).toBeInTheDocument();
      expect(screen.getByText(/broadcast is live/i)).toBeInTheDocument();
    });
  });

  it('keeps the preview visible and shows the error when go live fails', async () => {
    mockState.getTeacherLiveSessionById.mockResolvedValue(createTeacherSession());
    mockState.startTeacherLiveSessionById.mockRejectedValue(
      new Error('Unable to start the live session.'),
    );

    render(<LiveClassroomPage role="teacher" courseId="course-1" sessionId="session-1" />);

    await screen.findByText('Local preview: Local preview');
    await userEvent.click(screen.getByRole('button', { name: /go live/i }));

    expect(await screen.findByText(/unable to start the live session/i)).toBeInTheDocument();
    expect(screen.getByText('Local preview: Local preview')).toBeInTheDocument();
  });

  it('shows the fullscreen control on the student teacher stream tile', async () => {
    mockState.call.remoteTiles = [
      {
        id: 'teacher-stream',
        participantId: 'teacher-1',
        displayName: 'Teacher stream',
        target: document.createElement('div'),
        mediaStreamType: 'Video',
        isReceiving: true,
      },
    ];
    mockState.getStudentLiveSessionById.mockResolvedValue(createStudentSession());

    render(<LiveClassroomPage role="student" courseId="course-1" sessionId="session-1" />);

    expect(await screen.findByText('Teacher stream [fullscreen]: Teacher stream')).toBeInTheDocument();
  });
});
