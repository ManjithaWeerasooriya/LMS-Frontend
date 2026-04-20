const ISO_DATETIME_WITHOUT_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,7})?)?$/;

const ISO_DATETIME_WITH_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2}|[+-]\d{2})$/i;

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

export const normalizeUtcDateTimeString = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (ISO_DATETIME_WITH_TIMEZONE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (ISO_DATETIME_WITHOUT_TIMEZONE_PATTERN.test(trimmed)) {
    return `${trimmed}Z`;
  }

  return trimmed;
};

export const parseUtcDateTimeString = (value?: string | null): Date | null => {
  const normalized = normalizeUtcDateTimeString(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDateTimeLocalInputValue = (value?: string | null): string => {
  const parsed = parseUtcDateTimeString(value);
  if (!parsed) {
    return '';
  }

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const toUtcIsoStringFromLocalInput = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const localMatch = DATETIME_LOCAL_PATTERN.exec(trimmed);
  if (localMatch) {
    const [
      ,
      year,
      month,
      day,
      hours,
      minutes,
      seconds = '0',
      millisecondsRaw = '0',
    ] = localMatch;
    const milliseconds = Number(millisecondsRaw.padEnd(3, '0'));
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
      milliseconds,
    );

    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};
