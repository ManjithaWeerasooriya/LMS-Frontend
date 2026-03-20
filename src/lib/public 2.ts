export type PublicStats = {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
};

const DEFAULT_LOCAL_API_URL = 'http://localhost:5251';

function resolvePublicApiUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_LOCAL_API_URL;
  }

  return null;
}

export async function getPublicStats(): Promise<PublicStats | null> {
  const apiBaseUrl = resolvePublicApiUrl();

  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/stats`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Partial<PublicStats>;

    return {
      totalCourses: typeof data.totalCourses === 'number' ? data.totalCourses : 0,
      totalStudents: typeof data.totalStudents === 'number' ? data.totalStudents : 0,
      totalTeachers: typeof data.totalTeachers === 'number' ? data.totalTeachers : 0,
    };
  } catch {
    return null;
  }
}
