import { downloadMaterialFromPath } from '@/features/materials/api/shared';
import {
  extractFilenameFromContentDisposition,
  resolveDownloadFilename,
} from '@/lib/files';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockIsAxiosAuthError } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockIsAxiosAuthError: vi.fn(),
}));

vi.mock('@/lib/http', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  isAxiosAuthError: (...args: unknown[]) => mockIsAxiosAuthError(...args),
}));

describe('material binary downloads', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockIsAxiosAuthError.mockReset();
    mockIsAxiosAuthError.mockReturnValue(false);

    if (!window.URL.createObjectURL) {
      Object.defineProperty(window.URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    if (!window.URL.revokeObjectURL) {
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('requests the material as a blob and downloads it using the backend filename', async () => {
    const createObjectUrlSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:material-download');
    const revokeObjectUrlSpy = vi
      .spyOn(window.URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const createElementSpy = vi.spyOn(document, 'createElement');

    mockGet.mockResolvedValue({
      data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      headers: {
        'content-disposition': "attachment; filename*=UTF-8''Week%201%20Pack.pdf",
        'content-type': 'application/pdf',
      },
    });

    await downloadMaterialFromPath('/api/v1/student/materials/12/download', 'fallback.docx');

    expect(mockGet).toHaveBeenCalledWith('/api/v1/student/materials/12/download', {
      responseType: 'blob',
    });
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect((createObjectUrlSpy.mock.calls[0]?.[0] as Blob).type).toBe('application/pdf');

    const anchor = createElementSpy.mock.results.at(-1)?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('Week 1 Pack.pdf');
    expect(anchor.href).toBe('blob:material-download');
    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.runAllTimers();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:material-download');
  });

  it('keeps the fallback extension when the response omits Content-Disposition', async () => {
    const createObjectUrlSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:slides');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createElementSpy = vi.spyOn(document, 'createElement');

    mockGet.mockResolvedValue({
      data: new Blob(['slides'], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }),
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
    });

    await downloadMaterialFromPath('/api/v1/teacher/materials/8/download', 'week-8-slides.pptx');

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const anchor = createElementSpy.mock.results.at(-1)?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('week-8-slides.pptx');
  });
});

describe('file download helpers', () => {
  it('extracts encoded Content-Disposition filenames', () => {
    expect(
      extractFilenameFromContentDisposition(
        "attachment; filename*=UTF-8''IELTS%20Speaking%20Guide.pdf",
      ),
    ).toBe('IELTS Speaking Guide.pdf');
  });

  it('infers a missing extension from the content type', () => {
    expect(
      resolveDownloadFilename({
        contentType: 'application/pdf',
        fallbackFilename: 'week-3-handout',
      }),
    ).toBe('week-3-handout.pdf');
  });
});
