import { apiClient, isAxiosAuthError } from '@/lib/http';

export type MaterialType = 'pdf' | 'video' | 'assignment' | 'other';

export type CourseMaterial = {
  id: number;
  courseId: string;
  title: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
  fileSizeBytes: number;
  materialType: MaterialType;
  description: string | null;
  weekLabel: string | null;
  weekNumber: number | null;
  moduleTitle: string | null;
  lessonTitle: string | null;
  sortOrder: number | null;
};

export class MaterialsApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MaterialsApiError';
    this.status = status;
  }
}

export type MaterialDto = {
  id?: number;
  courseId?: string | null;
  title?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  uploadedAt?: string | null;
  fileSizeBytes?: number | null;
  materialType?: string | null;
  description?: string | null;
  weekLabel?: string | null;
  weekNumber?: number | null;
  week?: string | number | null;
  moduleTitle?: string | null;
  moduleName?: string | null;
  module?: string | null;
  lessonTitle?: string | null;
  lessonName?: string | null;
  lesson?: string | null;
  orderIndex?: number | null;
  sortOrder?: number | null;
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

const unwrapCollection = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ['items', 'results', 'data', 'materials']) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
    if (isRecord(nested)) {
      const unwrapped = unwrapCollection(nested);
      if (unwrapped.length > 0) {
        return unwrapped;
      }
    }
  }

  return [];
};

const normalizeMaterialType = (value?: string | null, fileName?: string | null): MaterialType => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'pdf') return 'pdf';
  if (normalized === 'video') return 'video';
  if (normalized === 'assignment') return 'assignment';

  const extension = fileName?.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension ?? '')) return 'video';
  if (['doc', 'docx', 'ppt', 'pptx'].includes(extension ?? '')) return 'assignment';
  return 'other';
};

export const toCourseMaterial = (dto: MaterialDto): CourseMaterial => {
  const record = (isRecord(dto) ? dto : {}) as MaterialDto & Record<string, unknown>;

  return {
    id: readNumber(record, ['id']) ?? 0,
    courseId: readString(record, ['courseId']) ?? '',
    title: readString(record, ['title', 'name']) ?? readString(record, ['fileName']) ?? 'Untitled material',
    fileName: readString(record, ['fileName']) ?? 'material',
    fileUrl: readString(record, ['fileUrl', 'url']) ?? null,
    uploadedAt: readString(record, ['uploadedAt', 'createdAt']) ?? new Date().toISOString(),
    fileSizeBytes: readNumber(record, ['fileSizeBytes', 'sizeInBytes', 'size']) ?? 0,
    materialType: normalizeMaterialType(
      readString(record, ['materialType', 'type']),
      readString(record, ['fileName']),
    ),
    description: readString(record, ['description', 'summary']),
    weekLabel:
      readString(record, ['weekLabel', 'weekName']) ??
      (typeof record.week === 'string' && record.week.trim() ? record.week.trim() : null),
    weekNumber:
      readNumber(record, ['weekNumber']) ??
      (typeof record.week === 'number' && Number.isFinite(record.week) ? record.week : null),
    moduleTitle: readString(record, ['moduleTitle', 'moduleName', 'module']),
    lessonTitle: readString(record, ['lessonTitle', 'lessonName', 'lesson']),
    sortOrder: readNumber(record, ['sortOrder', 'orderIndex']),
  };
};

export const mapCourseMaterials = (value: unknown): CourseMaterial[] =>
  unwrapCollection(value)
    .map((item) => toCourseMaterial(item as MaterialDto))
    .filter((material) => material.id > 0);

export const convertMaterialsAxiosError = (error: unknown): never => {
  if (isAxiosAuthError(error) && error.response) {
    const message =
      (error.response.data as { message?: string } | undefined)?.message ??
      'Unable to complete materials request.';
    throw new MaterialsApiError(message, error.response.status);
  }

  if (error instanceof Error) {
    throw new MaterialsApiError(error.message, 0);
  }

  throw new MaterialsApiError('Unable to complete materials request.', 0);
};

const extractFilename = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const matches = /filename\*=UTF-8''([^;]+)|filename="?([^;"]+)"?/i.exec(headerValue);
  if (matches?.[1]) {
    return decodeURIComponent(matches[1]);
  }
  if (matches?.[2]) {
    return matches[2];
  }
  return null;
};

export async function downloadMaterialFromPath(path: string, fallbackFilename: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const response = await apiClient.get<Blob>(path, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const filename = extractFilename(response.headers?.['content-disposition']) ?? fallbackFilename;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    convertMaterialsAxiosError(error);
  }
}
