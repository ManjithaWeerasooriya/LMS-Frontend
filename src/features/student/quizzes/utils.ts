'use client';

type AvailabilityFormatOptions = {
  fallbackLabel?: string;
};

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const shortDateWithYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isSameYear = (left: Date, right: Date) => left.getFullYear() === right.getFullYear();

const parseDate = (value: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatOpenEndedAvailability = (prefix: 'Opens' | 'Closes', value: Date) =>
  `${prefix} ${shortDateWithYearFormatter.format(value)}`;

export const formatStudentQuizAvailability = (
  availableFrom: string | null,
  availableUntil: string | null,
  fallbackLabel?: string | null,
  options: AvailabilityFormatOptions = {},
) => {
  const parsedStart = parseDate(availableFrom);
  const parsedEnd = parseDate(availableUntil);

  if (parsedStart && parsedEnd) {
    if (isSameDay(parsedStart, parsedEnd)) {
      return `${shortDateFormatter.format(parsedStart)}, ${timeFormatter.format(parsedStart)} - ${timeFormatter.format(parsedEnd)}`;
    }

    if (isSameYear(parsedStart, parsedEnd)) {
      return `${shortDateFormatter.format(parsedStart)} - ${shortDateWithYearFormatter.format(parsedEnd)}`;
    }

    return `${shortDateWithYearFormatter.format(parsedStart)} - ${shortDateWithYearFormatter.format(parsedEnd)}`;
  }

  if (parsedStart) {
    return formatOpenEndedAvailability('Opens', parsedStart);
  }

  if (parsedEnd) {
    return formatOpenEndedAvailability('Closes', parsedEnd);
  }

  if (fallbackLabel?.trim()) {
    return fallbackLabel.trim();
  }

  return options.fallbackLabel ?? 'Availability to be announced';
};

export const getStudentQuizDisplayStatus = (status?: string | null) => {
  const normalized = status?.trim().toLowerCase();

  if (!normalized) {
    return 'Not Started';
  }

  if (normalized.includes('retake')) {
    return 'Retake Available';
  }

  if (
    normalized.includes('submitted') ||
    normalized.includes('completed') ||
    normalized.includes('finished') ||
    normalized.includes('attempted')
  ) {
    return 'Completed';
  }

  if (
    normalized.includes('in progress') ||
    normalized.includes('started') ||
    normalized.includes('active') ||
    normalized.includes('ongoing')
  ) {
    return 'In Progress';
  }

  if (
    normalized.includes('unavailable') ||
    normalized.includes('not available') ||
    normalized.includes('expired') ||
    normalized.includes('closed')
  ) {
    return 'Unavailable';
  }

  if (
    normalized.includes('published') ||
    normalized.includes('available') ||
    normalized.includes('open') ||
    normalized.includes('scheduled')
  ) {
    return 'Not Started';
  }

  return status?.trim() || 'Not Started';
};
