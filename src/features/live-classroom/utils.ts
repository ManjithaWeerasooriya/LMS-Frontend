import type { LiveSessionStatus } from '@/generated/api-types';
import type {
  ClassroomAttendanceStatus,
  ClassroomRecordingStatus,
} from '@/features/live-classroom/api';

export const LIVE_CLASSROOM_STATUS = {
  scheduled: 1 as LiveSessionStatus,
  live: 2 as LiveSessionStatus,
  ended: 3 as LiveSessionStatus,
  cancelled: 4 as LiveSessionStatus,
};

export const LIVE_CLASSROOM_RECORDING_STATUS = {
  notStarted: 1 as ClassroomRecordingStatus,
  inProgress: 2 as ClassroomRecordingStatus,
  available: 3 as ClassroomRecordingStatus,
  failed: 4 as ClassroomRecordingStatus,
};

const formatDate = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string => {
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString(undefined, options);
};

const formatTime = (value: string | Date): string => {
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatLiveClassroomDateTime = (value?: string | null): string => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return `${formatDate(parsed, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} at ${formatTime(parsed)}`;
};

export const formatLiveClassroomTimeRange = (
  startTime?: string | null,
  durationMinutes = 0,
): string => {
  if (!startTime) return '—';

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return '—';
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  return `${formatTime(start)} - ${formatTime(end)}`;
};

export const formatDurationLabel = (durationMinutes: number): string => {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (!minutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

export const formatAttendanceDuration = (durationSeconds: number): string => {
  if (durationSeconds <= 0) {
    return '0 min';
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

export const getLiveClassroomStatusMeta = (
  status: LiveSessionStatus,
): { label: string; className: string } => {
  switch (status) {
    case LIVE_CLASSROOM_STATUS.live:
      return {
        label: 'Live',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case LIVE_CLASSROOM_STATUS.ended:
      return {
        label: 'Ended',
        className: 'bg-slate-100 text-slate-600',
      };
    case LIVE_CLASSROOM_STATUS.cancelled:
      return {
        label: 'Cancelled',
        className: 'bg-rose-50 text-rose-700',
      };
    case LIVE_CLASSROOM_STATUS.scheduled:
    default:
      return {
        label: 'Scheduled',
        className: 'bg-blue-50 text-blue-700',
      };
  }
};

export const getRecordingStatusMeta = (
  status: ClassroomRecordingStatus,
): { label: string; className: string } => {
  switch (status) {
    case LIVE_CLASSROOM_RECORDING_STATUS.inProgress:
      return {
        label: 'Recording',
        className: 'bg-rose-50 text-rose-700',
      };
    case LIVE_CLASSROOM_RECORDING_STATUS.available:
      return {
        label: 'Recording Ready',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case LIVE_CLASSROOM_RECORDING_STATUS.failed:
      return {
        label: 'Recording Failed',
        className: 'bg-amber-50 text-amber-700',
      };
    case LIVE_CLASSROOM_RECORDING_STATUS.notStarted:
    default:
      return {
        label: 'Recording Off',
        className: 'bg-slate-100 text-slate-600',
      };
  }
};

export const getAttendanceStatusMeta = (
  status: ClassroomAttendanceStatus,
): { label: string; className: string } => {
  switch (status) {
    case 2:
      return {
        label: 'Present',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case 3:
      return {
        label: 'Late',
        className: 'bg-amber-50 text-amber-700',
      };
    case 4:
      return {
        label: 'Left Early',
        className: 'bg-orange-50 text-orange-700',
      };
    case 5:
      return {
        label: 'Absent',
        className: 'bg-rose-50 text-rose-700',
      };
    case 1:
    default:
      return {
        label: 'Pending',
        className: 'bg-slate-100 text-slate-600',
      };
  }
};

export const getParticipantLabel = (
  displayName?: string | null,
  fallback = 'Participant',
): string => {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const readCommunicationRawId = (identifier: unknown): string => {
  if (!identifier || typeof identifier !== 'object') {
    return '';
  }

  const record = identifier as Record<string, unknown>;
  if (typeof record.rawId === 'string') {
    return record.rawId;
  }

  if (
    record.communicationUser &&
    typeof record.communicationUser === 'object' &&
    record.communicationUser !== null
  ) {
    const communicationUser = record.communicationUser as Record<string, unknown>;
    if (typeof communicationUser.id === 'string') {
      return communicationUser.id;
    }
  }

  return '';
};

export const canStudentJoinLiveClassroom = (status: LiveSessionStatus) =>
  status === LIVE_CLASSROOM_STATUS.live;
