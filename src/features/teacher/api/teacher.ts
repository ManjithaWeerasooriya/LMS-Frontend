import { apiClient } from '@/lib/http';
import type {
  CourseDetailDto,
  CourseListItemDto,
  CreateCourseRequestDto,
  CreateQuizDto,
  LiveSessionStatus,
  TeacherDashboardResponseDto,
} from '@/generated/api-types';
import {
  LIVE_SESSION_STATUS,
  getTeacherLiveSessionsByCourse,
  type TeacherLiveSession,
} from '@/features/teacher/live-sessions/api';

// Types mirroring the backend DTOs (simplified to what the UI needs).

export type TeacherDashboardSummary = {
  myCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  upcomingLiveSessions: number;
};

export type DashboardCourse = {
  courseId: string;
  title: string;
  students: number;
  averageProgressPercent: number;
  status: string;
};

export type PerformanceSlice = {
  label: string;
  value: number;
  color: string;
};

export type CompletionRate = {
  courseId: string;
  courseTitle: string;
  percent: number;
};

export type TeacherDashboardLiveSession = {
  id: string;
  courseId?: string | null;
  title: string;
  courseTitle: string | null;
  startTime: string;
  durationMinutes: number | null;
  studentsEnrolled: number;
  status: LiveSessionStatus;
};

export type PendingSubmission = {
  assignmentId: string;
  assignmentTitle: string;
  courseTitle: string;
  dueDate: string;
  pendingCount: number;
  totalCount: number;
};

export type TeacherQuiz = {
  id: string;
  title: string;
  courseTitle: string;
  questionCount: number;
  durationMinutes: number;
  attempts: number;
  averageScorePercent: number;
};

export type TeacherCourse = {
  id: string;
  title: string;
  category?: string | null;
  instructorName: string;
  students: number;
  price: number;
  rating?: number | null;
  status: string;
};

export type TeacherCourseDetail = {
  id: string;
  title: string;
  category?: string | null;
  description?: string | null;
  durationHours: number;
  price: number;
  maxStudents: number;
  difficultyLevel?: string | null;
  prerequisites?: string | null;
  status: string;
};

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

const normalizeLiveSessionStatus = (value: unknown): LiveSessionStatus => {
  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as LiveSessionStatus;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 4) {
      return parsed as LiveSessionStatus;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'scheduled') return LIVE_SESSION_STATUS.scheduled;
    if (normalized === 'live') return LIVE_SESSION_STATUS.live;
    if (normalized === 'ended') return LIVE_SESSION_STATUS.ended;
    if (normalized === 'cancelled') return LIVE_SESSION_STATUS.cancelled;
  }

  return LIVE_SESSION_STATUS.scheduled;
};

const normalizeDashboardLiveSession = (value: unknown): TeacherDashboardLiveSession => {
  const record = isRecord(value) ? value : {};

  return {
    id: readString(record, ['id', 'sessionId', 'liveSessionId', 'liveClassId']) ?? '',
    courseId: readString(record, ['courseId']) ?? null,
    title: readString(record, ['title', 'topic', 'name']) ?? 'Live Session',
    courseTitle: readString(record, ['courseTitle']) ?? null,
    startTime: readString(record, ['startTime', 'scheduledAt', 'startsAt']) ?? '',
    durationMinutes: readNumber(record, ['durationMinutes']) ?? null,
    studentsEnrolled: readNumber(record, ['studentsEnrolled', 'studentCount', 'attendees']) ?? 0,
    status: normalizeLiveSessionStatus(record.status),
  };
};

export async function getTeacherDashboard(): Promise<{
  summary: TeacherDashboardSummary;
  courses: DashboardCourse[];
  performance: PerformanceSlice[];
  completion: CompletionRate[];
  sessions: TeacherDashboardLiveSession[];
  submissions: PendingSubmission[];
}> {
  const { data } = await apiClient.get<TeacherDashboardResponseDto & Record<string, unknown>>(
    '/api/v1/teacher/dashboard',
  );
  const summaryRecord = isRecord(data.summary) ? data.summary : {};
  const liveSessionItems = Array.isArray(data.upcomingLiveSessions)
    ? data.upcomingLiveSessions
    : Array.isArray(data.upcomingClasses)
      ? data.upcomingClasses
      : [];

  const summary: TeacherDashboardSummary = {
    myCourses: readNumber(summaryRecord, ['myCourses']) ?? 0,
    totalStudents: readNumber(summaryRecord, ['totalStudents']) ?? 0,
    pendingSubmissions: readNumber(summaryRecord, ['pendingSubmissions']) ?? 0,
    upcomingLiveSessions:
      readNumber(summaryRecord, ['upcomingLiveSessions', 'upcomingClasses']) ?? 0,
  };

  const courses: DashboardCourse[] = (data.myCourses ?? []).map((course) => ({
    courseId: course.courseId ?? '',
    title: course.title?.trim() || 'Untitled Course',
    students: course.students ?? 0,
    averageProgressPercent: course.averageProgressPercent ?? 0,
    status: course.status?.trim() || 'Unknown',
  }));

  const performance: PerformanceSlice[] = [
    { label: 'Excellent', value: data.performance?.excellentPercentage ?? 0, color: '#22c55e' },
    { label: 'Good', value: data.performance?.goodPercentage ?? 0, color: '#3b82f6' },
    { label: 'Average', value: data.performance?.averagePercentage ?? 0, color: '#f97316' },
    { label: 'Needs Improvement', value: data.performance?.needsImprovementPercentage ?? 0, color: '#ef4444' },
  ];

  const completion: CompletionRate[] = (data.completionRates ?? []).map((item) => ({
    courseId: item.courseId ?? '',
    courseTitle: item.courseTitle?.trim() || 'Untitled Course',
    percent: item.completionRate ?? 0,
  }));

  const sessions = liveSessionItems
    .map(normalizeDashboardLiveSession)
    .filter((session) => session.id)
    .sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );

  const submissions: PendingSubmission[] = (data.pendingSubmissions ?? []).map((submission) => ({
    assignmentId: submission.assignmentId ?? '',
    assignmentTitle: submission.assignmentTitle?.trim() || 'Untitled Assignment',
    courseTitle: submission.courseTitle?.trim() || 'Unknown Course',
    dueDate: submission.dueDate ?? '',
    pendingCount: submission.pendingCount ?? 0,
    totalCount: submission.totalCount ?? 0,
  }));

  return {
    summary,
    courses,
    performance,
    completion,
    sessions,
    submissions,
  };
}

export async function getTeacherCourses(search?: string): Promise<TeacherCourse[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  const query = params.toString();
  const { data } = await apiClient.get<CourseListItemDto[]>(
    `/api/v1/teacher/courses${query ? `?${query}` : ''}`,
  );

  return data.map((course) => ({
    id: course.id ?? '',
    title: course.title?.trim() || 'Untitled Course',
    category: course.category ?? null,
    instructorName: course.instructorName?.trim() || '',
    students: course.students ?? 0,
    price: course.price ?? 0,
    rating: course.rating ?? null,
    status: course.status?.trim() || 'Unknown',
  }));
}

export async function getTeacherCourseById(id: string): Promise<TeacherCourseDetail> {
  const { data } = await apiClient.get<CourseDetailDto>(`/api/v1/teacher/courses/${id}`);
  return {
    id: data.id ?? '',
    title: data.title?.trim() || 'Untitled Course',
    category: data.category ?? null,
    description: data.description ?? null,
    durationHours: data.durationHours ?? 0,
    price: data.price ?? 0,
    maxStudents: data.maxStudents ?? 1,
    difficultyLevel: data.difficultyLevel ?? null,
    prerequisites: data.prerequisites ?? null,
    status: data.status?.trim() || 'Unknown',
  };
}

export async function getTeacherQuizzes(): Promise<TeacherQuiz[]> {
  const { data } = await apiClient.get<TeacherQuiz[]>('/api/v1/teacher/quizzes');
  return data;
}

export async function getTeacherAllLiveSessions(): Promise<TeacherLiveSession[]> {
  const courses = await getTeacherCourses();

  if (courses.length === 0) {
    return [];
  }

  const sessionResults = await Promise.allSettled(
    courses.map((course) => getTeacherLiveSessionsByCourse(course.id)),
  );

  return sessionResults
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );
}

export async function getTeacherPendingSubmissions(): Promise<PendingSubmission[]> {
  // Pending submissions are provided as part of the dashboard; this helper is kept
  // for compatibility but will typically be driven by getTeacherDashboard().
  const dashboard = await getTeacherDashboard();
  return dashboard.submissions;
}

export type CreateCourseInput = {
  title: string;
  category?: string;
  description?: string;
  durationHours?: number;
  price?: number;
  maxStudents?: number;
  difficulty?: string;
  prerequisites?: string;
  status?: string;
};

export async function createCourse(input: CreateCourseInput): Promise<void> {
  const payload: CreateCourseRequestDto = {
    title: input.title.trim(),
    category: input.category?.trim() || null,
    description: input.description?.trim() || null,
    durationHours: input.durationHours ?? 0,
    price: input.price ?? 0,
    maxStudents: input.maxStudents ?? 100,
    difficultyLevel: input.difficulty?.trim() || null,
    prerequisites: input.prerequisites?.trim() || null,
    status: input.status?.trim() || null,
  };

  await apiClient.post('/api/v1/teacher/courses', payload);
}

export async function updateCourse(id: string, input: CreateCourseInput): Promise<void> {
  const payload: CreateCourseRequestDto = {
    title: input.title.trim(),
    category: input.category?.trim() || null,
    description: input.description?.trim() || null,
    durationHours: input.durationHours ?? 0,
    price: input.price ?? 0,
    maxStudents: input.maxStudents ?? 100,
    difficultyLevel: input.difficulty?.trim() || null,
    prerequisites: input.prerequisites?.trim() || null,
    status: input.status?.trim() || null,
  };

  await apiClient.put(`/api/v1/teacher/courses/${id}`, payload);
}

export async function deleteCourse(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/teacher/courses/${id}`);
}

export type CreateQuizInput = {
  title: string;
  courseId: string;
  durationMinutes: number;
  totalMarks: number;
  description?: string;
};

export async function createQuiz(input: CreateQuizInput): Promise<void> {
  const payload: CreateQuizDto = {
    title: input.title.trim(),
    courseId: input.courseId,
    description: input.description?.trim() || null,
    durationMinutes: input.durationMinutes,
    totalMarks: input.totalMarks,
    isPublished: false,
    areResultsPublished: false,
  };

  await apiClient.post('/api/v1/teacher/quizzes', payload);
}
