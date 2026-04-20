const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  'application/msword': 'doc',
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/x-zip-compressed': 'zip',
  'application/zip': 'zip',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
};

type DownloadableData = Blob | ArrayBuffer | Uint8Array | string;

type DownloadFilenameOptions = {
  contentDisposition?: string | null;
  contentType?: string | null;
  fallbackFilename?: string | null;
  defaultFilename?: string;
};

const FILENAME_EXTENSION_PATTERN = /\.[a-z0-9]{1,12}$/i;

const normalizeContentType = (contentType?: string | null): string | null => {
  if (!contentType) {
    return null;
  }

  const [normalized] = contentType.split(';');
  return normalized?.trim().toLowerCase() || null;
};

const sanitizeFilename = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/^['"]+|['"]+$/g, '');
  if (!trimmed) {
    return null;
  }

  const filename = trimmed.split(/[\\/]/).pop()?.trim() ?? '';
  if (!filename) {
    return null;
  }

  return filename.replace(/[\u0000-\u001f<>:"|?*]+/g, '_');
};

const getExtensionFromContentType = (contentType?: string | null): string | null => {
  const normalizedContentType = normalizeContentType(contentType);
  if (!normalizedContentType) {
    return null;
  }

  return CONTENT_TYPE_EXTENSION_MAP[normalizedContentType] ?? null;
};

export const extractFilenameFromContentDisposition = (
  contentDisposition?: string | null,
): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const segments = contentDisposition.split(';');
  let filename: string | null = null;

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    const lowerSegment = trimmedSegment.toLowerCase();

    if (!lowerSegment.startsWith('filename*=') && !lowerSegment.startsWith('filename=')) {
      continue;
    }

    const rawValue = trimmedSegment.slice(trimmedSegment.indexOf('=') + 1).trim();

    if (lowerSegment.startsWith('filename*=')) {
      const decodedCandidate = rawValue
        .replace(/^utf-8''/i, '')
        .replace(/^['"]+|['"]+$/g, '');

      try {
        filename = sanitizeFilename(decodeURIComponent(decodedCandidate));
      } catch {
        filename = sanitizeFilename(decodedCandidate);
      }
    } else if (!filename) {
      filename = sanitizeFilename(rawValue);
    }

    if (filename) {
      return filename;
    }
  }

  return null;
};

export const resolveDownloadFilename = ({
  contentDisposition,
  contentType,
  fallbackFilename,
  defaultFilename = 'download',
}: DownloadFilenameOptions): string => {
  const filename =
    extractFilenameFromContentDisposition(contentDisposition) ??
    sanitizeFilename(fallbackFilename) ??
    sanitizeFilename(defaultFilename) ??
    'download';

  if (FILENAME_EXTENSION_PATTERN.test(filename)) {
    return filename;
  }

  const extension = getExtensionFromContentType(contentType);
  return extension ? `${filename}.${extension}` : filename;
};

export const toDownloadBlob = (data: DownloadableData, contentType?: string | null): Blob => {
  const normalizedContentType = normalizeContentType(contentType);

  if (data instanceof Blob) {
    if (!normalizedContentType || data.type === normalizedContentType) {
      return data;
    }

    return data.slice(0, data.size, normalizedContentType);
  }

  return new Blob([data], normalizedContentType ? { type: normalizedContentType } : undefined);
};

export const triggerBlobDownload = (blob: Blob, filename: string): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
};
