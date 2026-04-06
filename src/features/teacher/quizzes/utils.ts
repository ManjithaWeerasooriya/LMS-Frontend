export const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
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

export const toDateTimeLocalInput = (value?: string | null): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const toUtcIsoString = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

export const formatPercentage = (value: number): string => `${Math.round(value)}%`;

export const formatMarks = (value: number): string => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
};

export const slugifyFallback = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
