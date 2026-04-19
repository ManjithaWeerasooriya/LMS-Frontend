import type { LiveSessionStatus } from '@/generated/api-types';
import { LIVE_SESSION_STATUS } from '@/features/teacher/live-sessions/api';

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

export const formatLiveSessionDate = (value?: string | null): string =>
  value
    ? formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

export const formatLiveSessionDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return `${formatLiveSessionDate(value)} at ${formatTime(parsed)}`;
};

export const formatLiveSessionDayHeading = (value: Date): string =>
  formatDate(value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatLiveSessionMonth = (value: Date): string =>
  formatDate(value, {
    year: 'numeric',
    month: 'long',
  });

export const formatDurationMinutes = (durationMinutes: number): string => {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

export const formatLiveSessionTimeRange = (
  startTime: string,
  durationMinutes: number,
): string => {
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return '—';
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  return `${formatTime(start)} - ${formatTime(end)}`;
};

export const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const pad = (value: number) => String(value).padStart(2, '0');

export const toDateKey = (value: string | Date): string => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const getLiveSessionStatusMeta = (
  status: LiveSessionStatus,
): { label: string; className: string } => {
  switch (status) {
    case LIVE_SESSION_STATUS.live:
      return {
        label: 'Live',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case LIVE_SESSION_STATUS.ended:
      return {
        label: 'Ended',
        className: 'bg-slate-100 text-slate-600',
      };
    case LIVE_SESSION_STATUS.cancelled:
      return {
        label: 'Cancelled',
        className: 'bg-rose-50 text-rose-700',
      };
    case LIVE_SESSION_STATUS.scheduled:
    default:
      return {
        label: 'Scheduled',
        className: 'bg-blue-50 text-blue-700',
      };
  }
};

export const canEditLiveSession = (status: LiveSessionStatus): boolean =>
  status === LIVE_SESSION_STATUS.scheduled;

export const canCancelLiveSession = (status: LiveSessionStatus): boolean =>
  status === LIVE_SESSION_STATUS.scheduled;
