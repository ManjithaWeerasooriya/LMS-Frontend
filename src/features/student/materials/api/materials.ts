import { apiClient } from '@/lib/http';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import {
  convertMaterialsAxiosError,
  downloadMaterialFromPath,
  mapCourseMaterials,
  MaterialsApiError,
  type CourseMaterial,
} from '@/features/materials/api/shared';

const STUDENT_COURSE_MATERIALS_PATH = resolveApiPath('/api/v1/student/courses/{courseId}/materials');
const STUDENT_MATERIAL_DOWNLOAD_PATH = resolveApiPath('/api/v1/student/materials/{materialId}/download');

export type { CourseMaterial };
export { MaterialsApiError };

export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  try {
    const { data } = await apiClient.get<unknown>(
      buildApiPath(STUDENT_COURSE_MATERIALS_PATH, { courseId }),
    );

    return mapCourseMaterials(data);
  } catch (error) {
    throw convertMaterialsAxiosError(error);
  }
}

export async function downloadMaterial(materialId: number): Promise<void> {
  await downloadMaterialFromPath(
    buildApiPath(STUDENT_MATERIAL_DOWNLOAD_PATH, { materialId }),
    `material-${materialId}`,
  );
}
