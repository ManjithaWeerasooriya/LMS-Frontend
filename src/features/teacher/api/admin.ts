import { apiClient, isAxiosAuthError } from '@/lib/http';
import type {
  CourseListItemDto as ApiCourseListItemDto,
  CourseListItemDtoPagedResult as ApiCourseListItemDtoPagedResult,
  ReportOverviewDto as ApiReportOverviewDto,
  SuspendUserDto,
} from '@/generated/api-types';

export type AdminUserRole = 'Student' | 'Teacher' | 'Admin';
export type AdminUserStatus = 'Active' | 'Pending' | 'Suspended';

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminUserRole | string;
  status: AdminUserStatus | string;
  createdAt: string;
};

export type AdminUserListResponse = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  users: AdminUser[];
};

export type AdminUserQuery = {
  pageNumber?: number;
  pageSize?: number;
  role?: AdminUserRole;
  status?: AdminUserStatus;
};

export type PagedResult<T> = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type PagedResponse<T> = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type AdminCourse = {
  id: string;
  title: string;
  teacherName: string;
  teacherEmail?: string | null;
  status: string;
  enrollmentCount: number;
  createdAt: string;
};

export type AdminCourseQuery = {
  pageNumber?: number;
  pageSize?: number;
  teacherId?: string;
  status?: string;
  search?: string;
};

export type AdminCourseListResponse = PagedResponse<AdminCourse>;

export type AdminOverviewReport = {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  completionRate: number;
};

export type AdminCourseReportItem = {
  courseId: string;
  courseTitle: string;
  teacherName?: string | null;
  enrollmentCount: number;
  completionRate: number;
  status: string;
};

export type AdminCoursesReportResponse = {
  courses: AdminCourseReportItem[];
};

export type AdminQuizPerformanceBand = {
  label: string;
  percentage: number;
};

export type AdminQuizReportSummary = {
  averageScore: number;
  passRate: number;
  performanceBands: AdminQuizPerformanceBand[];
};

export type CourseEnrollmentStatDto = AdminCourseReportItem;

export type TeacherEnrollmentStatDto = {
  teacherId: string;
  teacherName: string;
  courseCount: number;
  enrollmentCount: number;
};

export type EnrollmentGrowthPointDto = {
  month: string;
  enrollments: number;
};

export type QuizAverageScoreDto = {
  quizId: string;
  quizTitle: string;
  averageScore: number;
  passRate: number;
  attempts: number;
};

export type PerformanceBandDto = Record<string, number>;

export type StudentAttemptStatDto = {
  studentId: string;
  studentName: string;
  attempts: number;
  averageScore: number;
};

export type CourseAttendanceDto = {
  courseId: string;
  courseTitle: string;
  attendanceRate: number;
  sessionsHeld: number;
};

export type StudentAttendanceTrendDto = {
  studentId: string;
  studentName: string;
  attendanceRate: number;
};

export type LiveSessionSummaryDto = {
  sessionId: string;
  title: string;
  startTime: string;
  attendees: number;
  liveSessionId?: string;
  liveClassId?: string;
  topic?: string;
  scheduledAt?: string;
  studentsEnrolled?: number;
};

export type ReportsOverviewResponse = {
  enrollment: {
    summary?: Record<string, unknown> | null;
    courses?: PagedResult<CourseEnrollmentStatDto>;
    enrollmentByCourse?: CourseEnrollmentStatDto[];
    totalStudents?: number;
    totalEnrollments?: number;
    teachers: TeacherEnrollmentStatDto[];
    monthlyGrowth: EnrollmentGrowthPointDto[];
  };
  quizzes: {
    summary: Record<string, unknown> | null;
    quizzes: QuizAverageScoreDto[];
    performanceBands: PerformanceBandDto | AdminQuizPerformanceBand[];
    attemptsByStudent: StudentAttemptStatDto[];
  };
  attendance: {
    courses: CourseAttendanceDto[];
    studentTrends: StudentAttendanceTrendDto[];
    upcomingSessions: LiveSessionSummaryDto[];
  };
};

export class AdminApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

const ADMIN_BASE = '/api/v1/admin';

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

const unwrapPayload = (value: unknown): unknown => {
  let current = value;
  while (current && typeof current === 'object' && !Array.isArray(current)) {
    const record = current as UnknownRecord;
    if (record.data != null) {
      current = record.data;
      continue;
    }
    if (record.result != null) {
      current = record.result;
      continue;
    }
    if (record.payload != null) {
      current = record.payload;
      continue;
    }
    return record;
  }
  return current;
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const coerceNumber = (value: unknown, fallback = 0): number => parseNumber(value) ?? fallback;

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const pickNumber = (record: UnknownRecord | null, keys: string[]): number | undefined => {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    if (key in record) {
      const parsed = parseNumber(record[key]);
      if (parsed != null) {
        return parsed;
      }
    }
  }
  return undefined;
};

const assignMetrics = (
  target: AdminOverviewReport,
  metrics: Partial<AdminOverviewReport>,
  tracker: { updated: boolean },
) => {
  (['totalUsers', 'totalCourses', 'totalEnrollments', 'completionRate'] as const).forEach((key) => {
    const value = metrics[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      target[key] = value;
      tracker.updated = true;
    }
  });
};

const extractOverviewMetrics = (record: UnknownRecord | null): Partial<AdminOverviewReport> => {
  if (!record) {
    return {};
  }

  const metrics: Partial<AdminOverviewReport> = {};
  const totalUsers = pickNumber(record, ['totalUsers', 'userCount', 'totalUserCount', 'users']);
  if (totalUsers != null) {
    metrics.totalUsers = totalUsers;
  }

  const totalCourses = pickNumber(record, ['totalCourses', 'courseCount', 'totalCourseCount', 'courses']);
  if (totalCourses != null) {
    metrics.totalCourses = totalCourses;
  }

  const totalEnrollments = pickNumber(record, [
    'totalEnrollments',
    'enrollmentCount',
    'totalEnrollmentCount',
    'enrollments',
    'students',
  ]);
  if (totalEnrollments != null) {
    metrics.totalEnrollments = totalEnrollments;
  }

  const completionRate = pickNumber(record, [
    'completionRate',
    'completionPercent',
    'completionPercentage',
    'completion',
  ]);
  if (completionRate != null) {
    metrics.completionRate = completionRate;
  }

  return metrics;
};

const normaliseOverview = (raw: unknown): AdminOverviewReport => {
  const payload = unwrapPayload(raw);
  const aggregated: AdminOverviewReport = {
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
  };
  const tracker = { updated: false };
  const visited = new WeakSet<object>();
  const MAX_DEPTH = 6;

  const applyKeyBasedMetric = (record: UnknownRecord) => {
    const keyText = coerceString(
      record.key ?? record.metric ?? record.metricKey ?? record.name ?? record.label ?? '',
      '',
    ).toLowerCase();
    const valueCandidate = parseNumber(record.value ?? record.count ?? record.total ?? record.amount);
    if (keyText && valueCandidate != null) {
      if (keyText.includes('user')) {
        aggregated.totalUsers = valueCandidate;
        tracker.updated = true;
      } else if (keyText.includes('course')) {
        aggregated.totalCourses = valueCandidate;
        tracker.updated = true;
      } else if (keyText.includes('enroll')) {
        aggregated.totalEnrollments = valueCandidate;
        tracker.updated = true;
      } else if (keyText.includes('completion') || keyText.includes('complete')) {
        aggregated.completionRate = valueCandidate;
        tracker.updated = true;
      }
    }
  };

  const processCollection = (collection: unknown, depth: number) => {
    if (!Array.isArray(collection) || depth > MAX_DEPTH) {
      return;
    }
    collection.forEach((item) => {
      processUnknown(item, depth + 1);
    });
  };

  const processUnknown = (value: unknown, depth: number) => {
    if (value == null || depth > MAX_DEPTH) {
      return;
    }

    if (Array.isArray(value)) {
      processCollection(value, depth);
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const obj = value as Record<string, unknown>;
    if (visited.has(obj)) {
      return;
    }
    visited.add(obj);
    const record = toRecord(obj);
    if (!record) {
      return;
    }

    assignMetrics(aggregated, extractOverviewMetrics(record), tracker);
    applyKeyBasedMetric(record);

    const nestedRecords = ['summary', 'overview', 'totals', 'result', 'payload', 'data'];
    nestedRecords.forEach((key) => {
      if (record[key] != null && typeof record[key] === 'object') {
        processUnknown(unwrapPayload(record[key]), depth + 1);
      }
    });

    const nestedCollections = [
      'items',
      'rows',
      'list',
      'entries',
      'records',
      'cards',
      'metrics',
      'sections',
      'values',
    ];
    nestedCollections.forEach((key) => {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        processCollection(candidate, depth + 1);
      }
    });
  };

  processUnknown(payload, 0);
  return aggregated;
};

const ensureCourseId = (record: UnknownRecord): string => {
  const rawId =
    record.courseId ?? record.courseID ?? record.id ?? record.courseIdentifier ?? record.slug ?? record.title;
  const value = coerceString(rawId, '').trim();
  if (value) {
    return value;
  }
  const fallback = coerceString(record.courseTitle ?? record.title ?? 'course', 'course');
  return `course-${fallback.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown'}`;
};

const normaliseCourseReportItems = (raw: unknown): AdminCourseReportItem[] => {
  const payload = unwrapPayload(raw);
  let collection: unknown = payload;

  if (!Array.isArray(collection)) {
    const record = toRecord(payload);
    if (record) {
      collection =
        record.courses ??
        record.items ??
        record.records ??
        record.results ??
        (Array.isArray(record.data) ? record.data : []);
    } else {
      collection = [];
    }
  }

  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.map((item) => {
    const record = toRecord(item) ?? {};
    const teacherValue = record.teacherName ?? record.instructorName ?? record.ownerName ?? null;
    return {
      courseId: ensureCourseId(record),
      courseTitle: coerceString(record.courseTitle ?? record.title ?? 'Untitled Course', 'Untitled Course'),
      teacherName: teacherValue != null ? coerceString(teacherValue, '') : null,
      enrollmentCount: coerceNumber(
        record.enrollmentCount ?? record.enrollments ?? record.totalEnrollments ?? record.students,
      ),
      completionRate: coerceNumber(
        record.completionRate ?? record.completionPercent ?? record.completionPercentage,
      ),
      status: coerceString(record.status ?? record.courseStatus ?? 'Unknown', 'Unknown'),
    };
  });
};

const normaliseQuizReport = (raw: unknown): AdminQuizReportSummary => {
  const payload = unwrapPayload(raw);
  let source: UnknownRecord | null = null;

  if (Array.isArray(payload) && payload.length > 0) {
    source = toRecord(payload[0]);
  } else {
    const record = toRecord(payload);
    if (record) {
      if (Array.isArray(record.items) && record.items.length > 0) {
        source = toRecord(record.items[0]);
      } else if (record.summary && typeof record.summary === 'object') {
        source = toRecord(record.summary);
      } else {
        source = record;
      }
    }
  }

  const resolved = source ?? {};
  const bandsRaw = resolved.performanceBands ?? resolved.bands ?? resolved.segments;
  const bandsArray = Array.isArray(bandsRaw) ? bandsRaw : [];

  const performanceBands: AdminQuizPerformanceBand[] = bandsArray.map((band) => {
    const record = toRecord(band) ?? {};
    return {
      label: coerceString(record.label ?? record.name ?? 'Band', 'Band'),
      percentage: coerceNumber(record.percentage ?? record.value ?? record.percent),
    };
  });

  return {
    averageScore: coerceNumber(
      resolved.averageScore ?? resolved.avgScore ?? resolved.average ?? resolved.averagePercent,
    ),
    passRate: coerceNumber(resolved.passRate ?? resolved.passPercentage ?? resolved.passPercent),
    performanceBands,
  };
};

export async function getAdminUsers(query: AdminUserQuery): Promise<AdminUserListResponse> {
  const params = new URLSearchParams();
  if (query.pageNumber) {
    params.set('pageNumber', String(query.pageNumber));
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }
  if (query.role) {
    params.set('role', query.role);
  }
  if (query.status) {
    params.set('status', query.status);
  }
  const search = params.toString();
  try {
    const { data } = await apiClient.get<AdminUserListResponse>(`${ADMIN_BASE}/users${search ? `?${search}` : ''}`);
    return data;
  } catch (error) {
    throw convertAxiosError(error);
  }
}

type RawAdminCourse = ApiCourseListItemDto & Partial<AdminCourse> & {
  teacher?: {
    fullName?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  instructorName?: string | null;
  ownerName?: string | null;
  instructorEmail?: string | null;
  createdOn?: string | null;
  createdDate?: string | null;
  created?: string | null;
  created_at?: string | null;
  createdAtUtc?: string | number | null;
  createdDateUtc?: string | number | null;
  createdUtc?: string | number | null;
  createdTimestamp?: string | number | null;
  created_at_utc?: string | number | null;
};

const normalizeDateValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
    return trimmed;
  }
  return undefined;
};

export async function getAdminCourses(query: AdminCourseQuery = {}): Promise<PagedResponse<AdminCourse>> {
  try {
    const { data } = await apiClient.get<ApiCourseListItemDtoPagedResult>(`${ADMIN_BASE}/courses`, {
      params: query,
    });

    const normalizedItems = (data.items ?? []).map((item) => {
      const raw = item as RawAdminCourse;
      const teacher = raw.teacher;
      const teacherNameFromTeacher =
        teacher?.fullName ??
        teacher?.name ??
        [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ').trim();
      const fallbackTeacherName =
        raw.teacherName ??
        raw.instructorName ??
        raw.ownerName ??
        (teacherNameFromTeacher ? teacherNameFromTeacher : undefined);
      const teacherEmail = raw.teacherEmail ?? teacher?.email ?? raw.instructorEmail ?? null;

      const createdAt =
        normalizeDateValue(raw.createdAt) ??
        normalizeDateValue(raw.createdOn) ??
        normalizeDateValue(raw.createdDate) ??
        normalizeDateValue(raw.created) ??
        normalizeDateValue(raw.created_at) ??
        normalizeDateValue(raw.createdAtUtc) ??
        normalizeDateValue(raw.createdDateUtc) ??
        normalizeDateValue(raw.createdUtc) ??
        normalizeDateValue(raw.createdTimestamp) ??
        normalizeDateValue((raw as { created_at_utc?: unknown }).created_at_utc) ??
        '';

      return {
        id: raw.id ?? '',
        title: raw.title?.trim() || 'Untitled Course',
        teacherName: fallbackTeacherName ?? 'Unknown Teacher',
        teacherEmail,
        status: raw.status?.trim() || 'Unknown',
        enrollmentCount: raw.students ?? raw.enrollmentCount ?? 0,
        createdAt: createdAt ?? '',
      };
    });

    return {
      pageNumber: data.pageNumber ?? 1,
      pageSize: data.pageSize ?? normalizedItems.length,
      totalCount: data.totalCount ?? normalizedItems.length,
      items: normalizedItems,
    };
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function disableCourseAdmin(courseId: string): Promise<void> {
  try {
    await apiClient.put(`${ADMIN_BASE}/courses/${courseId}/disable`, {});
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function deleteCourseAdmin(courseId: string): Promise<void> {
  try {
    await apiClient.delete(`${ADMIN_BASE}/courses/${courseId}`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function getAdminOverviewReport(): Promise<AdminOverviewReport> {
  try {
    const { data } = await apiClient.get<unknown>(`${ADMIN_BASE}/reports/overview`);
    return normaliseOverview(data);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function getAdminCoursesReport(): Promise<AdminCoursesReportResponse> {
  try {
    const { data } = await apiClient.get<unknown>(`${ADMIN_BASE}/reports/courses`);
    return { courses: normaliseCourseReportItems(data) };
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function getAdminQuizReport(): Promise<AdminQuizReportSummary> {
  try {
    const { data } = await apiClient.get<unknown>(`${ADMIN_BASE}/reports/quizzes`);
    return normaliseQuizReport(data);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function getAdminReportsOverview(): Promise<ReportsOverviewResponse> {
  try {
    const { data } = await apiClient.get<ApiReportOverviewDto>(`${ADMIN_BASE}/reports/overview`);
    return {
      enrollment: {
        summary: null,
        courses: undefined,
        enrollmentByCourse: (data.enrollment?.enrollmentByCourse ?? []).map((course) => ({
          courseId: course.courseId ?? '',
          courseTitle: course.courseTitle ?? 'Untitled Course',
          teacherName: null,
          enrollmentCount: course.studentCount ?? 0,
          completionRate: course.averageProgressPercent ?? 0,
          status: course.status ?? 'Unknown',
        })),
        totalStudents: data.enrollment?.totalStudents ?? 0,
        totalEnrollments: data.enrollment?.totalEnrollments ?? 0,
        teachers: [],
        monthlyGrowth: (data.enrollment?.monthlyGrowth ?? []).map((point) => ({
          month:
            point.year != null && point.month != null
              ? `${point.year}-${String(point.month).padStart(2, '0')}`
              : '',
          enrollments: point.enrollments ?? 0,
        })),
      },
      quizzes: {
        summary: null,
        quizzes: (data.quizzes?.averageScorePerQuiz ?? []).map((quiz) => ({
          quizId: quiz.quizId ?? '',
          quizTitle: quiz.quizTitle ?? 'Untitled Quiz',
          averageScore: quiz.averageScorePercent ?? 0,
          passRate: 0,
          attempts: quiz.attempts ?? 0,
        })),
        performanceBands: data.quizzes?.performanceBands ?? {},
        attemptsByStudent: [],
      },
      attendance: {
        courses: [],
        studentTrends: [],
        upcomingSessions: (data.attendance?.upcomingSessionDetails ?? []).map((session) => {
          const record = (toRecord(session) ?? {}) as Record<string, unknown>;

          return {
            sessionId: coerceString(
              record.sessionId ?? record.liveSessionId ?? record.liveClassId,
              '',
            ),
            title: coerceString(record.title ?? record.topic, 'Live Session'),
            startTime: coerceString(record.startTime ?? record.scheduledAt, ''),
            attendees: coerceNumber(record.studentsEnrolled ?? record.attendees, 0),
          };
        }),
      },
    };
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function suspendUser(userId: string, reason = ''): Promise<void> {
  try {
    const payload: SuspendUserDto = { userId, reason };
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/suspend`, payload);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function reactivateUser(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/reactivate`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function approveTeacher(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/approve`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

export async function rejectTeacher(userId: string): Promise<void> {
  try {
    await apiClient.patch(`${ADMIN_BASE}/users/${userId}/reject`);
  } catch (error) {
    throw convertAxiosError(error);
  }
}

function convertAxiosError(error: unknown): never {
  if (isAxiosAuthError(error) && error.response) {
    const message = (error.response.data as { message?: string } | undefined)?.message ?? 'Unable to complete request.';
    throw new AdminApiError(message, error.response.status);
  }
  if (error instanceof Error) {
    throw new AdminApiError(error.message, 0);
  }
  throw new AdminApiError('Unable to complete request.', 0);
}
