import {
  parseUtcDateTimeString,
  toDateTimeLocalInputValue,
  toUtcIsoStringFromLocalInput,
} from '@/lib/datetime';

export const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Not scheduled';

  const date = parseUtcDateTimeString(value);
  if (!date) {
    return value;
  }

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const toDateTimeLocalInput = (value?: string | null): string =>
  toDateTimeLocalInputValue(value);

export const toUtcIsoString = (value?: string | null): string | undefined =>
  toUtcIsoStringFromLocalInput(value);

export const formatPercentage = (value: number): string => `${Math.round(value)}%`;

export const formatMarks = (value: number): string => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
};

export const slugifyFallback = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
