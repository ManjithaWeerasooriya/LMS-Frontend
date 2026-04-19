import { buildLocator } from '@/features/live-classroom/hooks/useLiveClassroomCall';
import type { LiveClassroomJoinToken } from '@/features/live-classroom/api';

const createJoinToken = (
  overrides: Partial<LiveClassroomJoinToken> = {},
): LiveClassroomJoinToken => ({
  acsUserId: '8:acs:test-user',
  token: 'test-token',
  displayName: 'Test User',
  acsEndpoint: 'https://example.communication.azure.com',
  roomId: null,
  chatThreadId: null,
  session: {
    id: 'session-1',
    courseId: 'course-1',
    courseTitle: 'Course',
    title: 'Session',
    startTime: '2026-04-19T10:00:00Z',
    durationMinutes: 60,
    status: 2,
  },
  ...overrides,
});

describe('buildLocator', () => {
  it('returns a room locator when the backend provides room-based join data', () => {
    expect(
      buildLocator(
        createJoinToken({
          roomId: 'room-123',
        }),
      ),
    ).toEqual({
      type: 'room',
      locator: { roomId: 'room-123' },
      backendField: 'roomId',
    });
  });

  it('rejects tokens without room-based join data', () => {
    expect(buildLocator(createJoinToken())).toBeNull();
  });
});
