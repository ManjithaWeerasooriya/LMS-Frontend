import { buildLocator } from '@/features/live-classroom/hooks/useLiveClassroomCall';
import type { LiveClassroomJoinToken } from '@/features/live-classroom/api';

const createJoinToken = (
  overrides: Partial<LiveClassroomJoinToken> = {},
): LiveClassroomJoinToken => ({
  acsUserId: '8:acs:test-user',
  token: 'test-token',
  displayName: 'Test User',
  acsEndpoint: 'https://example.communication.azure.com',
  meetingType: null,
  roomId: null,
  groupId: null,
  meetingLink: null,
  meetingId: null,
  passcode: null,
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
  it('returns a room locator only when the backend says the session is a room call', () => {
    expect(
      buildLocator(
        createJoinToken({
          meetingType: 'room',
          roomId: 'room-123',
        }),
      ),
    ).toEqual({
      type: 'room',
      locator: { roomId: 'room-123' },
      backendField: 'roomId',
    });
  });

  it('returns a group locator only when the backend says the session is a group call', () => {
    expect(
      buildLocator(
        createJoinToken({
          meetingType: 'group',
          groupId: '11111111-1111-1111-1111-111111111111',
        }),
      ),
    ).toEqual({
      type: 'group',
      locator: { groupId: '11111111-1111-1111-1111-111111111111' },
      backendField: 'groupId',
    });
  });

  it('returns a Teams meeting-link locator only when the backend provides a Teams meeting link', () => {
    const meetingLink =
      'https://teams.microsoft.com/l/meetup-join/19%3ameeting_test%40thread.v2/0?context=%7B%7D';

    expect(
      buildLocator(
        createJoinToken({
          meetingType: 'teams',
          meetingLink,
        }),
      ),
    ).toEqual({
      type: 'teamsMeetingLink',
      locator: { meetingLink },
      backendField: 'meetingLink',
    });
  });

  it('returns a Teams meeting-id locator when the backend provides meeting ID coordinates', () => {
    expect(
      buildLocator(
        createJoinToken({
          meetingType: 'teams',
          meetingId: '123456789',
          passcode: 'secret-code',
        }),
      ),
    ).toEqual({
      type: 'teamsMeetingId',
      locator: { meetingId: '123456789', passcode: 'secret-code' },
      backendField: 'meetingId',
    });
  });

  it('rejects mismatched locator fields instead of guessing between backend fields', () => {
    expect(
      buildLocator(
        createJoinToken({
          meetingType: 'room',
          groupId: '11111111-1111-1111-1111-111111111111',
        }),
      ),
    ).toBeNull();
  });
});
