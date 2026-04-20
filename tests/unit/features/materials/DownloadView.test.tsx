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

  it('invokes the download handler and only renders the download action', async () => {
    const onDownload = vi.fn();
    render(<MaterialList materials={[material]} onDownload={onDownload} />);

    expect(screen.queryByRole('link', { name: /view|open/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(onDownload).toHaveBeenCalledWith(material);
  });
});
