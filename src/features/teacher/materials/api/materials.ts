import { apiClient } from '@/lib/http';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import {
  convertMaterialsAxiosError,
  downloadMaterialFromPath,
  mapCourseMaterials,
  MaterialsApiError,
  toCourseMaterial,
  type CourseMaterial,
  type MaterialDto,
  type MaterialType,
} from '@/features/materials/api/shared';

const MATERIALS_UPLOAD_PATH = resolveApiPath('/api/v1/teacher/materials/upload');
const MATERIALS_BY_COURSE_PATH = resolveApiPath('/api/v1/teacher/materials/course/{courseId}');
const MATERIAL_DOWNLOAD_PATH = resolveApiPath('/api/v1/teacher/materials/{id}/download');

export { MaterialsApiError };
export type { CourseMaterial, MaterialType };

export async function uploadMaterial(courseId: string, file: File, title?: string): Promise<CourseMaterial> {
  try {
    const payload = new FormData();
    payload.append('courseId', courseId);
    payload.append('file', file);

    if (title?.trim()) {
      payload.append('title', title.trim());
    }

    const response = await apiClient.post<MaterialDto>(MATERIALS_UPLOAD_PATH, payload);

    return toCourseMaterial(response.data);
  } catch (error) {
    throw convertMaterialsAxiosError(error);
  }
}

export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  try {
    const { data } = await apiClient.get<unknown>(
      buildApiPath(MATERIALS_BY_COURSE_PATH, { courseId }),
    );

    return mapCourseMaterials(data);
  } catch (error) {
    throw convertMaterialsAxiosError(error);
  }
}

export async function downloadMaterial(id: number): Promise<void> {
  await downloadMaterialFromPath(
    buildApiPath(MATERIAL_DOWNLOAD_PATH, { id }),
    `material-${id}`,
  );
}

export type { CourseMaterial as TeacherCourseMaterial };
