import { apiClient } from '@/lib/http';

export type StudentCourse = {
  id: string;
  title: string;
  category?: string | null;
  instructorName: string;
  studentsEnrolled: number;
  price: number;
  rating?: number | null;
  isEnrolled: boolean;
};

export type StudentDashboardSummary = {
  enrolledCourses: number;
  upcomingClasses: number;
  pendingQuizzes: number;
};

export type StudentDashboardCourse = {
  courseId: string;
  title: string;
  instructorName: string;
  progressPercent: number;
};

export type StudentDashboardLiveClass = {
  liveClassId: string;
  topic: string;
  courseTitle?: string | null;
  scheduledAt: string;
  durationMinutes?: number | null;
};

export type StudentDashboardQuiz = {
  quizId: string;
  title: string;
  courseTitle: string;
  durationMinutes: number;
};

export type CourseDiscussionMessage = {
  id: string;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAt: string;
  replies: CourseDiscussionMessage[];
};

type StudentDashboardResponse = {
  summary: {
    enrolledCourses: number;
    upcomingClasses: number;
    pendingQuizzes: number;
  };
  myCourses: {
    courseId: string;
    title: string;
    instructorName: string;
    progressPercent: number;
  }[];
  upcomingClasses: {
    liveClassId: string;
    topic: string;
    courseTitle?: string | null;
    scheduledAt: string;
    durationMinutes?: number | null;
  }[];
  pendingQuizzes: {
    quizId: string;
    title: string;
    courseTitle: string;
    durationMinutes: number;
  }[];
};

export async function getStudentDashboard(): Promise<{
  summary: StudentDashboardSummary;
  courses: StudentDashboardCourse[];
  upcomingClasses: StudentDashboardLiveClass[];
  pendingQuizzes: StudentDashboardQuiz[];
}> {
  const { data } = await apiClient.get<StudentDashboardResponse>(
    '/api/v1/student/dashboard',
  );

  const summary: StudentDashboardSummary = {
    enrolledCourses: data.summary.enrolledCourses,
    upcomingClasses: data.summary.upcomingClasses,
    pendingQuizzes: data.summary.pendingQuizzes,
  };

  const courses: StudentDashboardCourse[] = data.myCourses.map((course) => ({
    courseId: course.courseId,
    title: course.title,
    instructorName: course.instructorName,
    progressPercent: course.progressPercent,
  }));

  const upcomingClasses: StudentDashboardLiveClass[] = data.upcomingClasses.map(
    (session) => ({
      liveClassId: session.liveClassId,
      topic: session.topic,
      courseTitle: session.courseTitle ?? null,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes ?? null,
    }),
  );

  const pendingQuizzes: StudentDashboardQuiz[] = data.pendingQuizzes.map(
    (quiz) => ({
      quizId: quiz.quizId,
      title: quiz.title,
      courseTitle: quiz.courseTitle,
      durationMinutes: quiz.durationMinutes,
    }),
  );

  return {
    summary,
    courses,
    upcomingClasses,
    pendingQuizzes,
  };
}

export async function getAvailableStudentCourses(
  search?: string,
): Promise<StudentCourse[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  const query = params.toString();
  const { data } = await apiClient.get<StudentCourse[]>(
    `/api/v1/student/courses${query ? `?${query}` : ''}`,
  );

  return data;
}

export async function getMyStudentCourses(): Promise<StudentCourse[]> {
  const { data } = await apiClient.get<StudentCourse[]>(
    '/api/v1/student/courses/my',
  );
  return data;
}

export async function enrollInCourse(courseId: string): Promise<void> {
  await apiClient.post(`/api/v1/student/courses/${courseId}/enroll`);
}

export async function getCourseDiscussion(
  courseId: string,
): Promise<CourseDiscussionMessage[]> {
  const { data } = await apiClient.get<CourseDiscussionMessage[]>(
    `/api/v1/student/courses/${courseId}/discussions`,
  );
  return data;
}

export async function postCourseDiscussionMessage(
  courseId: string,
  content: string,
  parentMessageId?: string,
): Promise<CourseDiscussionMessage> {
  const payload: { content: string; parentMessageId?: string | null } = {
    content,
  };

  if (parentMessageId) {
    payload.parentMessageId = parentMessageId;
  }

  const { data } = await apiClient.post<CourseDiscussionMessage>(
    `/api/v1/student/courses/${courseId}/discussions`,
    payload,
  );

  return data;
}

