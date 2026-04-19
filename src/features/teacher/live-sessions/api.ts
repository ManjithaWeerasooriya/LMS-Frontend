import { isAxiosError } from 'axios';

import type {
  CreateLiveSessionRequestDto,
  LiveSessionStatus,
  MeetingType,
  UpdateLiveSessionRequestDto,
} from '@/generated/api-types';
import { apiClient } from '@/lib/http';

export const LIVE_SESSION_STATUS = {
  scheduled: 1 as LiveSessionStatus,
  live: 2 as LiveSessionStatus,
  ended: 3 as LiveSessionStatus,
  cancelled: 4 as LiveSessionStatus,
};

export type LiveSessionRecordingStatus = 1 | 2 | 3 | 4;
export type TeacherLiveSessionMeetingType = 1 | 2 | 3;

export const LIVE_SESSION_MEETING_TYPE = {
  room: 1 as TeacherLiveSessionMeetingType,
  group: 2 as TeacherLiveSessionMeetingType,
  teams: 3 as TeacherLiveSessionMeetingType,
};

export type TeacherLiveSession = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  status: LiveSessionStatus;
  recordingEnabled: boolean;
  playbackEnabled: boolean;
  meetingType?: TeacherLiveSessionMeetingType | null;
  roomId?: string | null;
  groupId?: string | null;
  meetingLink?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  acsRoomId?: string | null;
  acsCallLocator?: string | null;
  chatThreadId?: string | null;
  acsRecordingId?: string | null;
  recordingStatus: LiveSessionRecordingStatus;
  recordingUrl?: string | null;
  recordingStartedAt?: string | null;
  recordingStoppedAt?: string | null;
  teacherName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TeacherLiveSessionInput = {
  title: string;
  description?: string;
  startTimeLocal: string;
  durationMinutes: number;
  recordingEnabled: boolean;
  playbackEnabled: boolean;
} & (
  | {
      meetingType: typeof LIVE_SESSION_MEETING_TYPE.room;
      roomId: string;
      groupId?: never;
      meetingLink?: never;
      meetingId?: never;
      passcode?: never;
    }
  | {
      meetingType: typeof LIVE_SESSION_MEETING_TYPE.group;
      groupId: string;
      roomId?: never;
      meetingLink?: never;
      meetingId?: never;
      passcode?: never;
    }
  | {
      meetingType: typeof LIVE_SESSION_MEETING_TYPE.teams;
      meetingLink: string;
      roomId?: never;
      groupId?: never;
      meetingId?: never;
      passcode?: never;
    }
  | {
      meetingType: typeof LIVE_SESSION_MEETING_TYPE.teams;
      meetingId: string;
      passcode: string;
      roomId?: never;
      groupId?: never;
      meetingLink?: never;
    }
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const readBoolean = (record: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }

  return null;
};

const readRecord = (
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null => {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
};

const unwrapEntity = (value: unknown, keys: string[] = []): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  for (const key of [...keys, 'data', 'item', 'result']) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return value;
};

const unwrapCollection = (value: unknown, keys: string[] = []): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of [...keys, 'data', 'items', 'results']) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
};

const normalizeLiveSessionStatus = (value: unknown): LiveSessionStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as LiveSessionStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as LiveSessionStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'scheduled') return LIVE_SESSION_STATUS.scheduled;
    if (normalized === 'live') return LIVE_SESSION_STATUS.live;
    if (normalized === 'ended') return LIVE_SESSION_STATUS.ended;
    if (normalized === 'cancelled') return LIVE_SESSION_STATUS.cancelled;
  }

  return LIVE_SESSION_STATUS.scheduled;
};

const normalizeRecordingStatus = (value: unknown): LiveSessionRecordingStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as LiveSessionRecordingStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as LiveSessionRecordingStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'notstarted') return 1;
    if (normalized === 'inprogress') return 2;
    if (normalized === 'available') return 3;
    if (normalized === 'failed') return 4;
  }

  return 1;
};

const normalizeMeetingType = (value: unknown): TeacherLiveSessionMeetingType | null => {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed as TeacherLiveSessionMeetingType;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'room') return LIVE_SESSION_MEETING_TYPE.room;
    if (normalized === 'group') return LIVE_SESSION_MEETING_TYPE.group;
    if (normalized === 'teams') return LIVE_SESSION_MEETING_TYPE.teams;
  }

  return null;
};

const normalizeLiveSession = (value: unknown): TeacherLiveSession => {
  const record = unwrapEntity(value, ['session', 'liveSession']);
  const courseRecord = readRecord(record, ['course']);

  return {
    id: readString(record, ['id', 'sessionId', 'liveSessionId']) ?? '',
    courseId:
      readString(record, ['courseId']) ??
      (courseRecord ? readString(courseRecord, ['id', 'courseId']) : null) ??
      '',
    courseTitle:
      readString(record, ['courseTitle']) ??
      (courseRecord ? readString(courseRecord, ['title', 'name']) : null) ??
      'Course',
    title: readString(record, ['title', 'topic', 'name']) ?? 'Untitled Session',
    description: readString(record, ['description', 'summary']) ?? '',
    startTime:
      readString(record, ['startTime', 'scheduledAt', 'startsAt', 'startTimeUtc']) ?? '',
    durationMinutes: readNumber(record, ['durationMinutes', 'duration']) ?? 60,
    status: normalizeLiveSessionStatus(record.status),
    recordingEnabled: readBoolean(record, ['recordingEnabled', 'enableRecording']) ?? false,
    playbackEnabled: readBoolean(record, ['playbackEnabled']) ?? false,
    meetingType: normalizeMeetingType(record.meetingType),
    roomId: readString(record, ['roomId']) ?? null,
    groupId: readString(record, ['groupId']) ?? null,
    meetingLink: readString(record, ['meetingLink']) ?? null,
    meetingId: readString(record, ['meetingId']) ?? null,
    passcode: readString(record, ['passcode']) ?? null,
    acsRoomId: readString(record, ['acsRoomId']) ?? null,
    acsCallLocator: readString(record, ['acsCallLocator']) ?? null,
    chatThreadId: readString(record, ['chatThreadId']) ?? null,
    acsRecordingId: readString(record, ['acsRecordingId']) ?? null,
    recordingStatus: normalizeRecordingStatus(record.recordingStatus),
    recordingUrl: readString(record, ['recordingUrl']) ?? null,
    recordingStartedAt: readString(record, ['recordingStartedAt']) ?? null,
    recordingStoppedAt: readString(record, ['recordingStoppedAt']) ?? null,
    teacherName: readString(record, ['teacherName']) ?? null,
    createdAt: readString(record, ['createdAt']) ?? null,
    updatedAt: readString(record, ['updatedAt']) ?? null,
  };
};

const toLiveSessionPayload = (
  input: TeacherLiveSessionInput,
): CreateLiveSessionRequestDto | UpdateLiveSessionRequestDto => {
  const basePayload: CreateLiveSessionRequestDto | UpdateLiveSessionRequestDto = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startTime: new Date(input.startTimeLocal).toISOString(),
    durationMinutes: input.durationMinutes,
    recordingEnabled: input.recordingEnabled,
    playbackEnabled: input.playbackEnabled,
    meetingType: input.meetingType as MeetingType,
  };

  if (input.meetingType === LIVE_SESSION_MEETING_TYPE.room) {
    return {
      ...basePayload,
      roomId: input.roomId.trim(),
    };
  }

  if (input.meetingType === LIVE_SESSION_MEETING_TYPE.group) {
    return {
      ...basePayload,
      groupId: input.groupId.trim(),
    };
  }

  if ('meetingLink' in input) {
    return {
      ...basePayload,
      meetingLink: input.meetingLink.trim(),
    };
  }

  return {
    ...basePayload,
    meetingId: input.meetingId.trim(),
    passcode: input.passcode.trim(),
  };
};

export const getLiveSessionErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong while loading live sessions.',
): string => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (isRecord(responseData)) {
    const message = readString(responseData, ['message', 'title', 'detail', 'error']);
    if (message) {
      return message;
    }
  }

  return error.message || fallback;
};

export async function getTeacherLiveSessionsByCourse(
  courseId: string,
): Promise<TeacherLiveSession[]> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/courses/${courseId}/live-sessions`);
  return unwrapCollection(data, ['sessions', 'liveSessions'])
    .map(normalizeLiveSession)
    .sort((left, right) => {
      const leftTime = new Date(left.startTime).getTime();
      const rightTime = new Date(right.startTime).getTime();
      return leftTime - rightTime;
    });
}

export async function getTeacherLiveSessionById(
  courseId: string,
  sessionId: string,
): Promise<TeacherLiveSession> {
  const sessions = await getTeacherLiveSessionsByCourse(courseId);
  const session = sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error('Live session not found in this course.');
  }

  return session;
}

export async function createTeacherLiveSession(
  courseId: string,
  input: TeacherLiveSessionInput,
): Promise<TeacherLiveSession> {
  const response = await apiClient.post<unknown>(
    `/api/v1/teacher/courses/${courseId}/live-sessions`,
    toLiveSessionPayload(input),
  );

  return normalizeLiveSession(response.data);
}

export async function updateTeacherLiveSession(
  sessionId: string,
  input: TeacherLiveSessionInput,
): Promise<TeacherLiveSession> {
  const response = await apiClient.put<unknown>(
    `/api/v1/teacher/live-sessions/${sessionId}`,
    toLiveSessionPayload(input),
  );

  return normalizeLiveSession(response.data);
}

export async function cancelTeacherLiveSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/teacher/live-sessions/${sessionId}`);
}
