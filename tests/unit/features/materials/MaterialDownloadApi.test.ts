import { downloadMaterial as downloadStudentMaterial } from '@/features/student/materials/api/materials';
import { downloadMaterial as downloadTeacherMaterial } from '@/features/teacher/materials/api/materials';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDownloadMaterialFromPath } = vi.hoisted(() => ({
  mockDownloadMaterialFromPath: vi.fn(),
}));

vi.mock('@/features/materials/api/shared', async () => {
  const actual = await vi.importActual<typeof import('@/features/materials/api/shared')>(
    '@/features/materials/api/shared',
  );

  return {
    ...actual,
    downloadMaterialFromPath: (...args: unknown[]) => mockDownloadMaterialFromPath(...args),
  };
});

describe('material download API wrappers', () => {
  beforeEach(() => {
    mockDownloadMaterialFromPath.mockReset();
  });

  it('uses the teacher download endpoint and the material file name as fallback', async () => {
    await downloadTeacherMaterial({
      fileName: 'week-4-notes.docx',
      id: 42,
    });

    expect(mockDownloadMaterialFromPath).toHaveBeenCalledWith(
      '/api/v1/teacher/materials/42/download',
      'week-4-notes.docx',
    );
  });

  it('falls back to a generic name only when the material has no file name', async () => {
    await downloadStudentMaterial({
      fileName: '   ',
      id: 17,
    });

    expect(mockDownloadMaterialFromPath).toHaveBeenCalledWith(
      '/api/v1/student/materials/17/download',
      'material-17',
    );
  });
});
