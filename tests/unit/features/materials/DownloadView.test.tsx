import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaterialList } from '@/features/teacher/materials/components/MaterialList';
import type { CourseMaterial } from '@/features/teacher/materials/api/materials';
import { vi } from 'vitest';

describe('LMS-88 Download/View controls', () => {
  const material: CourseMaterial = {
    id: 9,
    courseId: 'course-9',
    title: 'Assessment Brief',
    fileName: 'brief.docx',
    fileUrl: 'https://cdn.example.com/brief.docx',
    uploadedAt: '2026-03-05T09:00:00Z',
    fileSizeBytes: 5120,
    materialType: 'assignment',
  };

  it('invokes the download handler and exposes view link when fileUrl exists', async () => {
    const onDownload = vi.fn();
    render(<MaterialList materials={[material]} role="student" onDownload={onDownload} />);

    const viewLink = screen.getByRole('link', { name: /view/i });
    expect(viewLink).toHaveAttribute('href', material.fileUrl as string);

    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(onDownload).toHaveBeenCalledWith(material);
  });
});
