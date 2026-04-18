import { isAxiosError } from 'axios';

import type { LiveSessionStatus } from '@/generated/api-types';
import { apiClient } from '@/lib/http';

export type StudentLiveSessionRecordingStatus = 1 | 2 | 3 | 4;

export type StudentLiveSession = {
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
  acsRoomId?: string | null;
  acsCallLocator?: string | null;
  chatThreadId?: string | null;
  acsRecordingId?: string | null;
  recordingStatus: StudentLiveSessionRecordingStatus;
  recordingUrl?: string | null;
  recordingStartedAt?: string | null;
  recordingStoppedAt?: string | null;
  teacherName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

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

const normalizeStatus = (value: unknown): LiveSessionStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as LiveSessionStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as LiveSessionStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'scheduled') return 1;
    if (normalized === 'live') return 2;
    if (normalized === 'ended') return 3;
    if (normalized === 'cancelled') return 4;
  }

  return 1;
};

const normalizeRecordingStatus = (value: unknown): StudentLiveSessionRecordingStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as StudentLiveSessionRecordingStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as StudentLiveSessionRecordingStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'notstarted') return 1;
    if (normalized === 'inprogress') return 2;
    if (normalized === 'available') return 3;
    if (normalized === 'failed') return 4;
  }

  return 1;
};

const normalizeStudentLiveSession = (value: unknown): StudentLiveSession => {
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
    status: normalizeStatus(record.status),
    recordingEnabled: readBoolean(record, ['recordingEnabled', 'enableRecording']) ?? false,
    playbackEnabled: readBoolean(record, ['playbackEnabled']) ?? false,
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

export const getStudentLiveSessionErrorMessage = (
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

export async function getStudentLiveSessionsByCourse(
  courseId: string,
): Promise<StudentLiveSession[]> {
  const { data } = await apiClient.get<unknown>(`/api/v1/student/courses/${courseId}/live-sessions`);

  return unwrapCollection(data, ['sessions', 'liveSessions'])
    .map(normalizeStudentLiveSession)
    .sort((left, right) => {
      const leftTime = new Date(left.startTime).getTime();
      const rightTime = new Date(right.startTime).getTime();
      return leftTime - rightTime;
    });
}

export async function getStudentLiveSessionById(sessionId: string): Promise<StudentLiveSession> {
  const { data } = await apiClient.get<unknown>(`/api/v1/student/live-sessions/${sessionId}`);
  return normalizeStudentLiveSession(data);
}
