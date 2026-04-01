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
};

export class MaterialsApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MaterialsApiError';
    this.status = status;
  }
}

type MaterialDto = {
  id?: number;
  courseId?: string | null;
  title?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  uploadedAt?: string | null;
  fileSizeBytes?: number | null;
  materialType?: string | null;
};

const MATERIALS_BASE = '/api/materials';

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

const toCourseMaterial = (dto: MaterialDto): CourseMaterial => ({
  id: typeof dto.id === 'number' ? dto.id : 0,
  courseId: dto.courseId ?? '',
  title: dto.title?.trim() || dto.fileName?.trim() || 'Untitled material',
  fileName: dto.fileName?.trim() || 'material',
  fileUrl: dto.fileUrl?.trim() || null,
  uploadedAt: dto.uploadedAt ?? new Date().toISOString(),
  fileSizeBytes: typeof dto.fileSizeBytes === 'number' ? dto.fileSizeBytes : 0,
  materialType: normalizeMaterialType(dto.materialType, dto.fileName ?? undefined),
});

const convertAxiosError = (error: unknown): never => {
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

export async function uploadMaterial(courseId: string, file: File, title?: string): Promise<CourseMaterial> {
  try {
    const payload = new FormData();
    payload.append('courseId', courseId);
    payload.append('file', file);
    if (title?.trim()) {
      payload.append('title', title.trim());
    }

    const { data } = await apiClient.post<MaterialDto>(`${MATERIALS_BASE}/upload`, payload);
    return toCourseMaterial(data ?? {});
  } catch (error) {
    convertAxiosError(error);
  }
}

export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  try {
    const { data } = await apiClient.get<MaterialDto[]>(`${MATERIALS_BASE}/course/${courseId}`);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item) => toCourseMaterial(item ?? {}));
  } catch (error) {
    convertAxiosError(error);
  }
}

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

export async function downloadMaterial(id: number): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const response = await apiClient.get<Blob>(`${MATERIALS_BASE}/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const filename =
      extractFilename(response.headers?.['content-disposition']) ?? `material-${id}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    convertAxiosError(error);
  }
}

export type { CourseMaterial as TeacherCourseMaterial };
