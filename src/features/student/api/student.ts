import { apiClient, isAxiosAuthError } from '@/lib/http';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import type { LiveSessionStatus, StudentCourseListItemDto } from '@/generated/api-types';

export type StudentDashboardSummary = {
  enrolledCourses: number;
  upcomingLiveSessions: number;
  pendingQuizzes: number;
};

export type StudentDashboardCourse = {
  courseId: string;
  title: string;
  instructorName: string | null;
  progressPercent: number;
};

export type StudentDashboardLiveSession = {
  id: string;
  courseId: string | null;
  title: string;
  courseTitle: string | null;
  startTime: string;
  durationMinutes: number | null;
  status: LiveSessionStatus;
};

export type StudentDashboardQuiz = {
  quizId: string;
  title: string;
  courseTitle: string | null;
  durationMinutes: number;
};

export type StudentCourseListItem = {
  id: string;
  title: string;
  category: string | null;
  instructorName: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  progressPercent: number | null;
  studentsEnrolled: number | null;
  price: number | null;
  rating: number | null;
  isEnrolled: boolean;
};

export class StudentApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StudentApiError';
    this.status = status;
  }
}

export async function getStudentDashboard(): Promise<{
  summary: StudentDashboardSummary;
  myCourses: StudentDashboardCourse[];
  upcomingLiveSessions: StudentDashboardLiveSession[];
  pendingQuizzes: StudentDashboardQuiz[];
}> {
  try {
    const { data } = await apiClient.get<unknown>(resolveApiPath('/api/v1/student/dashboard'));
    const payload = isRecord(data) ? data : {};
    const summary = isRecord(payload.summary) ? payload.summary : {};
    const myCourses = Array.isArray(payload.myCourses) ? payload.myCourses : [];
    const pendingQuizzes = Array.isArray(payload.pendingQuizzes) ? payload.pendingQuizzes : [];
    const upcomingLiveSessions = Array.isArray(payload.upcomingLiveSessions)
      ? payload.upcomingLiveSessions
      : Array.isArray(payload.upcomingClasses)
        ? payload.upcomingClasses
        : [];

    return {
      summary: {
        enrolledCourses: readNumber(summary, ['enrolledCourses']) ?? 0,
        upcomingLiveSessions:
          readNumber(summary, ['upcomingLiveSessions', 'upcomingClasses']) ?? 0,
        pendingQuizzes: readNumber(summary, ['pendingQuizzes']) ?? 0,
      },
      myCourses: myCourses.map((course) => {
        const record = isRecord(course) ? course : {};

        return {
          courseId: readString(record, ['courseId']) ?? '',
          title: readString(record, ['title']) ?? 'Untitled Course',
          instructorName: readString(record, ['instructorName']) ?? null,
          progressPercent: readNumber(record, ['progressPercent']) ?? 0,
        };
      }),
      upcomingLiveSessions: upcomingLiveSessions
        .map(normalizeStudentDashboardLiveSession)
        .filter((session) => session.id),
      pendingQuizzes: pendingQuizzes.map((quiz) => {
        const record = isRecord(quiz) ? quiz : {};

        return {
          quizId: readString(record, ['quizId']) ?? '',
          title: readString(record, ['title']) ?? 'Untitled Quiz',
          courseTitle: readString(record, ['courseTitle']) ?? null,
          durationMinutes: readNumber(record, ['durationMinutes']) ?? 0,
        };
      }),
    };
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to load student dashboard.');
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const normalizeStatus = (value: unknown): LiveSessionStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as LiveSessionStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as LiveSessionStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'scheduled') return 1;
    if (normalized === 'live') return 2;
    if (normalized === 'ended') return 3;
    if (normalized === 'cancelled') return 4;
  }

  return 1;
};

const normalizeStudentDashboardLiveSession = (value: unknown): StudentDashboardLiveSession => {
  const record = isRecord(value) ? value : {};

  return {
    id: readString(record, ['id', 'sessionId', 'liveSessionId', 'liveClassId']) ?? '',
    courseId: readString(record, ['courseId']) ?? null,
    title: readString(record, ['title', 'topic', 'name']) ?? 'Upcoming Live Session',
    courseTitle: readString(record, ['courseTitle']) ?? null,
    startTime: readString(record, ['startTime', 'scheduledAt', 'startsAt']) ?? '',
    durationMinutes: readNumber(record, ['durationMinutes']) ?? null,
    status: normalizeStatus(record.status),
  };
};

const buildCourseDescription = (title: string, rawDescription: string | null): string | null => {
  if (rawDescription) {
    return rawDescription;
  }

  return `${title} is available from your student dashboard. Course details will appear here as content is published.`;
};

function normalizeStudentCourse(course: StudentCourseListItemDto): StudentCourseListItem {
  const record = (isRecord(course) ? course : {}) as StudentCourseListItemDto & Record<string, unknown>;
  const title = readString(record, ['title', 'name']) ?? 'Untitled Course';

  return {
    id: readString(record, ['id', 'courseId']) ?? '',
    title,
    category: readString(record, ['category']) ?? null,
    instructorName:
      readString(record, [
        'instructorName',
        'teacherName',
        'teacherFullName',
        'teacherDisplayName',
        'instructorFullName',
        'instructorDisplayName',
      ]) ?? null,
    description: buildCourseDescription(
      title,
      readString(record, ['description', 'summary', 'shortDescription']),
    ),
    thumbnailUrl:
      readString(record, ['thumbnailUrl', 'imageUrl', 'coverImageUrl', 'thumbnail', 'image']) ??
      null,
    progressPercent: readNumber(record, ['progressPercent', 'progress']) ?? null,
    studentsEnrolled:
      readNumber(record, ['studentsEnrolled', 'students', 'studentCount', 'enrollmentCount']) ??
      null,
    price: readNumber(record, ['price']) ?? null,
    rating: readNumber(record, ['rating']) ?? null,
    isEnrolled: Boolean(record.isEnrolled),
  };
}

export async function getStudentCourses(search?: string): Promise<StudentCourseListItem[]> {
  try {
    const params = search?.trim() ? { search: search.trim() } : undefined;
    const { data } = await apiClient.get<StudentCourseListItemDto[]>(
      resolveApiPath('/api/v1/student/courses'),
      { params },
    );

    return (data ?? []).map(normalizeStudentCourse).filter((course) => course.id);
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to load student courses.');
  }
}

export async function getMyStudentCourses(): Promise<StudentCourseListItem[]> {
  try {
    const { data } = await apiClient.get<StudentCourseListItemDto[]>(
      resolveApiPath('/api/v1/student/courses/my'),
    );
    return (data ?? []).map(normalizeStudentCourse).filter((course) => course.id);
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to load enrolled courses.');
  }
}

export async function enrollInStudentCourse(courseId: string): Promise<void> {
  try {
    await apiClient.post(
      buildApiPath('/api/v1/student/courses/{courseId}/enroll', { courseId }),
    );
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to enroll in this course.');
  }
}

export function convertStudentAxiosError(
  error: unknown,
  fallback = 'Unable to load student data.',
): never {
  if (isAxiosAuthError(error) && error.response) {
    const message =
      (error.response.data as { message?: string } | undefined)?.message ?? fallback;
    throw new StudentApiError(message, error.response.status);
  }

  if (error instanceof Error) {
    throw new StudentApiError(error.message, 0);
  }

  throw new StudentApiError(fallback, 0);
}
