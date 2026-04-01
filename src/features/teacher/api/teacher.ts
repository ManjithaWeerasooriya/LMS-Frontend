import { apiClient } from '@/lib/http';
import type {
  CourseDetailDto,
  CourseListItemDto,
  CreateCourseRequestDto,
  CreateQuizDto,
  LiveClassListItemDto,
  ScheduleLiveClassRequestDto,
  TeacherDashboardResponseDto,
} from '@/generated/api-types';

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

export type LiveSession = {
  id: string;
  topic: string;
  courseTitle?: string | null;
  scheduledAt: string;
  studentsEnrolled: number;
  meetingLink?: string | null;
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

export async function getTeacherDashboard(): Promise<{
  summary: TeacherDashboardSummary;
  courses: DashboardCourse[];
  performance: PerformanceSlice[];
  completion: CompletionRate[];
  sessions: LiveSession[];
  submissions: PendingSubmission[];
}> {
  const { data } = await apiClient.get<TeacherDashboardResponseDto>('/api/v1/teacher/dashboard');

  const summary: TeacherDashboardSummary = {
    myCourses: data.summary?.myCourses ?? 0,
    totalStudents: data.summary?.totalStudents ?? 0,
    pendingSubmissions: data.summary?.pendingSubmissions ?? 0,
    upcomingLiveSessions: data.summary?.upcomingLiveSessions ?? 0,
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

  const sessions: LiveSession[] = (data.upcomingLiveSessions ?? []).map((session) => ({
    id: session.liveClassId ?? '',
    topic: session.topic?.trim() || 'Live Class',
    courseTitle: session.courseTitle ?? undefined,
    scheduledAt: session.scheduledAt ?? '',
    studentsEnrolled: session.studentsEnrolled ?? 0,
    meetingLink: session.meetingLink ?? undefined,
  }));

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

export async function getTeacherLiveSessions(): Promise<LiveSession[]> {
  const { data } = await apiClient.get<LiveClassListItemDto[]>('/api/v1/teacher/live-classes');
  return data.map((session) => ({
    id: session.id ?? '',
    topic: session.topic?.trim() || 'Live Class',
    courseTitle: session.courseTitle ?? undefined,
    scheduledAt: session.scheduledAt ?? '',
    studentsEnrolled: session.studentsEnrolled ?? 0,
    meetingLink: session.meetingLink ?? undefined,
  }));
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

export type ScheduleLiveClassInput = {
  topic: string;
  date: string;
  time: string;
  meetingLink?: string;
  enableRecording?: boolean;
  durationMinutes?: number;
  courseId?: string;
};

export async function scheduleLiveClass(input: ScheduleLiveClassInput): Promise<void> {
  const scheduledLocal = new Date(`${input.date}T${input.time}`);

  const payload: ScheduleLiveClassRequestDto = {
    topic: input.topic.trim(),
    courseId: input.courseId ?? null,
    scheduledAt: scheduledLocal.toISOString(),
    meetingLink: input.meetingLink?.trim() || null,
    enableRecording: input.enableRecording ?? false,
    durationMinutes: input.durationMinutes ?? null,
  };

  await apiClient.post('/api/v1/teacher/live-classes', payload);
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
