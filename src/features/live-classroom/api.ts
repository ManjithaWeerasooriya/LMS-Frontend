import { isAxiosError } from 'axios';

import type { LiveSessionStatus } from '@/generated/api-types';
import { apiClient } from '@/lib/http';

export type ClassroomRecordingStatus = 1 | 2 | 3 | 4;
export type ClassroomAttendanceStatus = 1 | 2 | 3 | 4 | 5;

export type LiveClassroomJoinToken = {
  acsUserId: string;
  token: string;
  displayName: string;
  acsEndpoint?: string | null;
  roomId?: string | null;
  chatThreadId?: string | null;
  session: {
    id: string;
    courseId: string;
    courseTitle: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    status: LiveSessionStatus;
  };
};

export type LiveSessionRecording = {
  sessionId: string;
  courseId: string;
  courseTitle: string;
  sessionTitle: string;
  playbackEnabled: boolean;
  acsRecordingId?: string | null;
  recordingStatus: ClassroomRecordingStatus;
  recordingUrl?: string | null;
  recordingStartedAt?: string | null;
  recordingStoppedAt?: string | null;
};

export type LiveSessionAttendanceRecord = {
  id?: string;
  sessionId: string;
  studentId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  joinTime?: string | null;
  leaveTime?: string | null;
  durationSeconds: number;
  attendanceStatus: ClassroomAttendanceStatus;
  lastSeenAt?: string | null;
};

export type LiveSessionAttendanceSummary = {
  sessionId: string;
  courseId: string;
  courseTitle: string;
  sessionTitle: string;
  startTime: string;
  durationMinutes: number;
  status: LiveSessionStatus;
  totalEnrolledStudents: number;
  totalJoinedStudents: number;
  totalCompletedAttendances: number;
  students: LiveSessionAttendanceRecord[];
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

const normalizeRecordingStatus = (value: unknown): ClassroomRecordingStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as ClassroomRecordingStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as ClassroomRecordingStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'notstarted') return 1;
    if (normalized === 'inprogress') return 2;
    if (normalized === 'available') return 3;
    if (normalized === 'failed') return 4;
  }

  return 1;
};

const normalizeAttendanceStatus = (value: unknown): ClassroomAttendanceStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 5) {
    return value as ClassroomAttendanceStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed as ClassroomAttendanceStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'pending') return 1;
    if (normalized === 'present') return 2;
    if (normalized === 'late') return 3;
    if (normalized === 'leftearly') return 4;
    if (normalized === 'absent') return 5;
  }

  return 1;
};

const normalizeJoinToken = (value: unknown): LiveClassroomJoinToken => {
  const record = unwrapEntity(value, ['token', 'joinToken']);
  const sessionRecord = unwrapEntity(record.session ?? record.liveSession ?? {}, ['session']);

  return {
    acsUserId: readString(record, ['acsUserId']) ?? '',
    token: readString(record, ['token']) ?? '',
    displayName: readString(record, ['displayName']) ?? 'Participant',
    acsEndpoint: readString(record, ['acsEndpoint']) ?? null,
    roomId: readString(record, ['roomId']) ?? null,
    chatThreadId: readString(record, ['chatThreadId']) ?? null,
    session: {
      id: readString(sessionRecord, ['id', 'sessionId']) ?? '',
      courseId: readString(sessionRecord, ['courseId']) ?? '',
      courseTitle: readString(sessionRecord, ['courseTitle']) ?? 'Course',
      title: readString(sessionRecord, ['title']) ?? 'Live Session',
      startTime:
        readString(sessionRecord, ['startTime', 'scheduledAt', 'startsAt']) ?? '',
      durationMinutes: readNumber(sessionRecord, ['durationMinutes', 'duration']) ?? 60,
      status: normalizeStatus(sessionRecord.status),
    },
  };
};

const normalizeRecording = (value: unknown): LiveSessionRecording => {
  const record = unwrapEntity(value, ['recording']);

  return {
    sessionId: readString(record, ['sessionId']) ?? '',
    courseId: readString(record, ['courseId']) ?? '',
    courseTitle: readString(record, ['courseTitle']) ?? 'Course',
    sessionTitle: readString(record, ['sessionTitle', 'title']) ?? 'Live Session',
    playbackEnabled: readBoolean(record, ['playbackEnabled']) ?? false,
    acsRecordingId: readString(record, ['acsRecordingId']) ?? null,
    recordingStatus: normalizeRecordingStatus(record.recordingStatus),
    recordingUrl: readString(record, ['recordingUrl']) ?? null,
    recordingStartedAt: readString(record, ['recordingStartedAt']) ?? null,
    recordingStoppedAt: readString(record, ['recordingStoppedAt']) ?? null,
  };
};

const normalizeAttendanceRecord = (value: unknown): LiveSessionAttendanceRecord => {
  const record = unwrapEntity(value, ['student', 'attendance']);

  return {
    id: readString(record, ['id']) ?? undefined,
    sessionId: readString(record, ['sessionId']) ?? '',
    studentId: readString(record, ['studentId']) ?? '',
    studentName: readString(record, ['studentName']) ?? null,
    studentEmail: readString(record, ['studentEmail']) ?? null,
    joinTime: readString(record, ['joinTime']) ?? null,
    leaveTime: readString(record, ['leaveTime']) ?? null,
    durationSeconds: readNumber(record, ['durationSeconds']) ?? 0,
    attendanceStatus: normalizeAttendanceStatus(record.attendanceStatus),
    lastSeenAt: readString(record, ['lastSeenAt']) ?? null,
  };
};

const normalizeAttendanceSummary = (value: unknown): LiveSessionAttendanceSummary => {
  const record = unwrapEntity(value, ['summary', 'attendance']);

  return {
    sessionId: readString(record, ['sessionId']) ?? '',
    courseId: readString(record, ['courseId']) ?? '',
    courseTitle: readString(record, ['courseTitle']) ?? 'Course',
    sessionTitle: readString(record, ['sessionTitle', 'title']) ?? 'Live Session',
    startTime: readString(record, ['startTime', 'scheduledAt']) ?? '',
    durationMinutes: readNumber(record, ['durationMinutes']) ?? 60,
    status: normalizeStatus(record.status),
    totalEnrolledStudents: readNumber(record, ['totalEnrolledStudents']) ?? 0,
    totalJoinedStudents: readNumber(record, ['totalJoinedStudents']) ?? 0,
    totalCompletedAttendances: readNumber(record, ['totalCompletedAttendances']) ?? 0,
    students: unwrapCollection(record.students, ['students']).map(normalizeAttendanceRecord),
  };
};

export const getLiveClassroomErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong while loading the live classroom.',
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

export async function createLiveSessionJoinToken(
  sessionId: string,
): Promise<LiveClassroomJoinToken> {
  const response = await apiClient.post<unknown>(`/api/v1/live-sessions/${sessionId}/join-token`);
  return normalizeJoinToken(response.data);
}

export async function joinStudentLiveSessionAttendance(
  sessionId: string,
): Promise<LiveSessionAttendanceRecord> {
  const response = await apiClient.post<unknown>(`/api/v1/live-sessions/${sessionId}/attendance/join`);
  return normalizeAttendanceRecord(response.data);
}

export async function leaveStudentLiveSessionAttendance(
  sessionId: string,
): Promise<LiveSessionAttendanceRecord> {
  const response = await apiClient.post<unknown>(`/api/v1/live-sessions/${sessionId}/attendance/leave`);
  return normalizeAttendanceRecord(response.data);
}

export async function getStudentLiveSessionRecording(
  sessionId: string,
): Promise<LiveSessionRecording> {
  const { data } = await apiClient.get<unknown>(`/api/v1/live-sessions/${sessionId}/recording`);
  return normalizeRecording(data);
}

export async function startTeacherLiveSessionById(sessionId: string) {
  const response = await apiClient.post<unknown>(`/api/v1/teacher/live-sessions/${sessionId}/start`);
  return unwrapEntity(response.data, ['session', 'liveSession']);
}

export async function endTeacherLiveSessionById(sessionId: string) {
  const response = await apiClient.post<unknown>(`/api/v1/teacher/live-sessions/${sessionId}/end`);
  return unwrapEntity(response.data, ['session', 'liveSession']);
}

export async function startTeacherLiveSessionRecording(
  sessionId: string,
): Promise<LiveSessionRecording> {
  const response = await apiClient.post<unknown>(
    `/api/v1/teacher/live-sessions/${sessionId}/recording/start`,
  );
  return normalizeRecording(response.data);
}

export async function stopTeacherLiveSessionRecording(
  sessionId: string,
): Promise<LiveSessionRecording> {
  const response = await apiClient.post<unknown>(
    `/api/v1/teacher/live-sessions/${sessionId}/recording/stop`,
  );
  return normalizeRecording(response.data);
}

export async function getTeacherLiveSessionAttendance(
  sessionId: string,
): Promise<LiveSessionAttendanceSummary> {
  const { data } = await apiClient.get<unknown>(`/api/v1/teacher/live-sessions/${sessionId}/attendance`);
  return normalizeAttendanceSummary(data);
}
