import { apiClient, isAxiosAuthError } from '@/lib/http';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import type { StudentCourseListItemDto, StudentDashboardResponseDto } from '@/generated/api-types';

export type StudentDashboardSummary = {
  enrolledCourses: number;
  upcomingClasses: number;
  pendingQuizzes: number;
};

export type StudentDashboardCourse = {
  courseId: string;
  title: string;
  instructorName: string | null;
  progressPercent: number;
};

export type StudentDashboardLiveClass = {
  liveClassId: string;
  topic: string;
  courseTitle: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
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
  upcomingClasses: StudentDashboardLiveClass[];
  pendingQuizzes: StudentDashboardQuiz[];
}> {
  try {
    const { data } = await apiClient.get<StudentDashboardResponseDto>(
      resolveApiPath('/api/v1/student/dashboard'),
    );

    return {
      summary: {
        enrolledCourses: data.summary?.enrolledCourses ?? 0,
        upcomingClasses: data.summary?.upcomingClasses ?? 0,
        pendingQuizzes: data.summary?.pendingQuizzes ?? 0,
      },
      myCourses: (data.myCourses ?? []).map((course) => ({
        courseId: course.courseId ?? '',
        title: course.title?.trim() || 'Untitled Course',
        instructorName: course.instructorName?.trim() || null,
        progressPercent: typeof course.progressPercent === 'number' ? course.progressPercent : 0,
      })),
      upcomingClasses: (data.upcomingClasses ?? []).map((liveClass) => ({
        liveClassId: liveClass.liveClassId ?? '',
        topic: liveClass.topic?.trim() || 'Upcoming Class',
        courseTitle: liveClass.courseTitle?.trim() || null,
        scheduledAt: liveClass.scheduledAt ?? '',
        durationMinutes:
          typeof liveClass.durationMinutes === 'number' ? liveClass.durationMinutes : null,
      })),
      pendingQuizzes: (data.pendingQuizzes ?? []).map((quiz) => ({
        quizId: quiz.quizId ?? '',
        title: quiz.title?.trim() || 'Untitled Quiz',
        courseTitle: quiz.courseTitle?.trim() || null,
        durationMinutes: typeof quiz.durationMinutes === 'number' ? quiz.durationMinutes : 0,
      })),
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
