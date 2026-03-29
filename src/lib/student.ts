import { apiClient, isAxiosAuthError } from '@/lib/http';

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

type StudentDashboardResponse = {
  summary?: {
    enrolledCourses?: number;
    upcomingClasses?: number;
    pendingQuizzes?: number;
  } | null;
  myCourses?: Array<{
    courseId?: string;
    title?: string | null;
    instructorName?: string | null;
    progressPercent?: number;
  }> | null;
  upcomingClasses?: Array<{
    liveClassId?: string;
    topic?: string | null;
    courseTitle?: string | null;
    scheduledAt?: string;
    durationMinutes?: number | null;
  }> | null;
  pendingQuizzes?: Array<{
    quizId?: string;
    title?: string | null;
    courseTitle?: string | null;
    durationMinutes?: number;
  }> | null;
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
    const { data } = await apiClient.get<StudentDashboardResponse>('/api/v1/student/dashboard');

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
    throw convertAxiosError(error);
  }
}

function convertAxiosError(error: unknown): never {
  if (isAxiosAuthError(error) && error.response) {
    const message =
      (error.response.data as { message?: string } | undefined)?.message ??
      'Unable to load student dashboard.';
    throw new StudentApiError(message, error.response.status);
  }

  if (error instanceof Error) {
    throw new StudentApiError(error.message, 0);
  }

  throw new StudentApiError('Unable to load student dashboard.', 0);
}
