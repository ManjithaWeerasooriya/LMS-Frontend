import {
  downloadMaterial as teacherDownloadMaterial,
  getCourseMaterials as teacherGetCourseMaterials,
  MaterialsApiError,
  type CourseMaterial,
} from '@/features/teacher/materials/api/materials';

export type { CourseMaterial };
export { MaterialsApiError };

export const getCourseMaterials = teacherGetCourseMaterials;
export const downloadMaterial = teacherDownloadMaterial;
