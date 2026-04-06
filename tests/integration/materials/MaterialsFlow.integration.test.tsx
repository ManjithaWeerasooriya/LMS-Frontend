import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadDropzone } from '@/features/teacher/materials/components/UploadDropzone';
import { MaterialList } from '@/features/teacher/materials/components/MaterialList';
import type { CourseMaterial } from '@/features/teacher/materials/api/materials';
import React from 'react';
import { vi } from 'vitest';

const mockUpload = vi.fn<(file: File, title?: string) => Promise<CourseMaterial>>();
const mockDownload = vi.fn();

function MaterialsFlowHarness() {
  const [materials, setMaterials] = React.useState<CourseMaterial[]>([]);

  const handleUpload = async (file: File, title?: string) => {
    const material = await mockUpload(file, title);
    setMaterials((current) => [...current, material]);
  };

  return (
    <div>
      <UploadDropzone courseId="course-77" onUpload={handleUpload} />
      <div className="mt-6">
        <MaterialList materials={materials} role="teacher" onDownload={mockDownload} />
      </div>
    </div>
  );
}

describe('Materials flow integration', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockDownload.mockReset();
  });

  it('uploads material and renders it in the teacher list view', async () => {
    const uploadedMaterial: CourseMaterial = {
      id: 99,
      courseId: 'course-77',
      title: 'Week 6 Workbook',
      fileName: 'week6.pdf',
      fileUrl: 'https://cdn.example.com/week6.pdf',
      uploadedAt: new Date().toISOString(),
      fileSizeBytes: 1024,
      materialType: 'pdf',
    };
    mockUpload.mockResolvedValue(uploadedMaterial);

    const { container } = render(<MaterialsFlowHarness />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'week6.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await userEvent.click(screen.getByRole('button', { name: /upload material/i }));

    await waitFor(() => expect(mockUpload).toHaveBeenCalledWith(file, undefined));
    expect(await screen.findByText('Week 6 Workbook')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(mockDownload).toHaveBeenCalledWith(uploadedMaterial);
  });
});
