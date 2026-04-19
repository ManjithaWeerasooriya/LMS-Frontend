/* tslint:disable */
/**
 * This file is auto-generated from docs/api/swagger.json.
 * Do not edit manually. Run `npm run generate:api-types` instead.
 */

export type AttendanceStatisticsDto = {
  "upcomingSessions"?: number;
  "completedSessionsLast30Days"?: number;
  "attendanceRate"?: number | null;
  "attendanceTrackingAvailable"?: boolean;
  "attendanceTrackingNote"?: string | null;
  "upcomingSessionDetails"?: Array<LiveSessionSummaryDto> | null;
};

export type AzureConnectionDiagnosticResultDto = {
  "success"?: boolean;
  "message"?: string | null;
  "checkedAt"?: string;
};

export type AzureConnectionDiagnosticsResponseDto = {
  "mySql"?: AzureConnectionDiagnosticResultDto;
  "azureBlobStorage"?: AzureConnectionDiagnosticResultDto;
  "azureCommunicationServices"?: AzureConnectionDiagnosticResultDto;
};

export type ChangePasswordRequest = {
  "currentPassword": string;
  "newPassword": string;
};

export type CourseCompletionRateItemDto = {
  "courseId"?: string;
  "courseTitle"?: string | null;
  "completionRate"?: number;
};

export type CourseDetailDto = {
  "id"?: string;
  "title"?: string | null;
  "category"?: string | null;
  "description"?: string | null;
  "durationHours"?: number;
  "price"?: number;
  "maxStudents"?: number;
  "difficultyLevel"?: string | null;
  "prerequisites"?: string | null;
  "status"?: string | null;
};

export type CourseEnrollmentStatDto = {
  "courseId"?: string;
  "courseTitle"?: string | null;
  "studentCount"?: number;
  "averageProgressPercent"?: number;
  "status"?: string | null;
};

export type CourseListItemDto = {
  "id"?: string;
  "title"?: string | null;
  "category"?: string | null;
  "instructorName"?: string | null;
  "students"?: number;
  "price"?: number;
  "rating"?: number | null;
  "status"?: string | null;
};

export type CourseListItemDtoPagedResult = {
  "pageNumber"?: number;
  "pageSize"?: number;
  "totalCount"?: number;
  "items"?: Array<CourseListItemDto> | null;
};

export type CoursesReportDto = {
  "enrollment"?: EnrollmentStatisticsDto;
  "completionRates"?: Array<CourseCompletionRateItemDto> | null;
};

export type CreateCourseRequestDto = {
  "title": string;
  "category"?: string | null;
  "description"?: string | null;
  "durationHours"?: number;
  "price"?: number;
  "maxStudents"?: number;
  "difficultyLevel"?: string | null;
  "prerequisites"?: string | null;
  "status"?: string | null;
};

export type CreateLiveSessionRequestDto = {
  "title": string;
  "description"?: string | null;
  "startTime": string;
  "durationMinutes"?: number;
  "status"?: LiveSessionStatus;
  "recordingEnabled"?: boolean;
  "playbackEnabled"?: boolean;
  "acsRoomId"?: string | null;
  "acsCallLocator"?: string | null;
  "chatThreadId"?: string | null;
};

export type CreateQuestionDto = {
  "text": string;
  "type": QuestionType;
  "marks"?: number;
  "orderIndex"?: number;
  "options"?: Array<QuestionOptionRequestDto> | null;
};

export type CreateQuizDto = {
  "courseId": string;
  "title": string;
  "description"?: string | null;
  "durationMinutes"?: number;
  "startTimeUtc"?: string;
  "endTimeUtc"?: string;
  "totalMarks"?: number;
  "randomizeQuestions"?: boolean;
  "allowMultipleAttempts"?: boolean;
  "isPublished"?: boolean;
  "areResultsPublished"?: boolean;
};

export type EnrollmentGrowthPointDto = {
  "year"?: number;
  "month"?: number;
  "enrollments"?: number;
};

export type EnrollmentStatisticsDto = {
  "totalEnrollments"?: number;
  "totalStudents"?: number;
  "enrollmentByCourse"?: Array<CourseEnrollmentStatDto> | null;
  "monthlyGrowth"?: Array<EnrollmentGrowthPointDto> | null;
};

export type ForgotPasswordRequest = {
  "email": string;
};

export type LiveSessionListItemDto = {
  "id"?: string;
  "courseId"?: string | null;
  "title"?: string | null;
  "courseTitle"?: string | null;
  "startTime"?: string;
  "durationMinutes"?: number | null;
  "studentsEnrolled"?: number;
  "status"?: LiveSessionStatus;
};

export type LiveSessionStatus = 1 | 2 | 3 | 4;

export type LiveSessionSummaryDto = {
  "sessionId"?: string;
  "courseId"?: string | null;
  "title"?: string | null;
  "startTime"?: string;
  "courseTitle"?: string | null;
  "durationMinutes"?: number | null;
  "studentsEnrolled"?: number;
  "status"?: LiveSessionStatus;
};

export type LoginRequest = {
  "email"?: string | null;
  "password"?: string | null;
  "deviceId"?: string | null;
};

export type LogoutRequest = {
  "refreshToken"?: string | null;
  "deviceId"?: string | null;
};

export type ManualGradeAnswerDto = {
  "awardedMarks"?: number;
  "teacherFeedback"?: string | null;
};

export type PerformanceBandDto = {
  "excellentPercentage"?: number;
  "goodPercentage"?: number;
  "averagePercentage"?: number;
  "needsImprovementPercentage"?: number;
};

export type QuestionOptionRequestDto = {
  "text": string;
  "isCorrect"?: boolean;
  "orderIndex"?: number;
};

export type QuestionType = 1 | 2 | 3 | 4 | 5 | 6;

export type QuizAverageScoreDto = {
  "quizId"?: string;
  "quizTitle"?: string | null;
  "courseTitle"?: string | null;
  "averageScorePercent"?: number;
  "attempts"?: number;
};

export type QuizStatisticsDto = {
  "totalAttempts"?: number;
  "averageScorePercent"?: number;
  "averageScorePerQuiz"?: Array<QuizAverageScoreDto> | null;
  "performanceBands"?: PerformanceBandDto;
};

export type RefreshRequest = {
  "refreshToken"?: string | null;
  "deviceId"?: string | null;
};

export type RegisterRequest = {
  "email"?: string | null;
  "password"?: string | null;
  "firstName"?: string | null;
  "lastName"?: string | null;
  "role"?: string | null;
};

export type ReportOverviewDto = {
  "enrollment"?: EnrollmentStatisticsDto;
  "quizzes"?: QuizStatisticsDto;
  "attendance"?: AttendanceStatisticsDto;
};

export type ResetPasswordRequest = {
  "userId": string;
  "token": string;
  "newPassword": string;
  "confirmPassword": string;
};

export type StudentCourseListItemDto = {
  "id"?: string;
  "title"?: string | null;
  "category"?: string | null;
  "instructorName"?: string | null;
  "studentsEnrolled"?: number;
  "price"?: number;
  "rating"?: number | null;
  "isEnrolled"?: boolean;
};

export type StudentDashboardCourseItemDto = {
  "courseId"?: string;
  "title"?: string | null;
  "instructorName"?: string | null;
  "progressPercent"?: number;
};

export type StudentDashboardLiveSessionItemDto = {
  "sessionId"?: string;
  "courseId"?: string | null;
  "title"?: string | null;
  "courseTitle"?: string | null;
  "startTime"?: string;
  "durationMinutes"?: number | null;
  "status"?: LiveSessionStatus;
};

export type StudentDashboardQuizItemDto = {
  "quizId"?: string;
  "title"?: string | null;
  "courseTitle"?: string | null;
  "durationMinutes"?: number;
};

export type StudentDashboardResponseDto = {
  "summary"?: StudentDashboardSummaryDto;
  "myCourses"?: Array<StudentDashboardCourseItemDto> | null;
  "upcomingLiveSessions"?: Array<StudentDashboardLiveSessionItemDto> | null;
  "pendingQuizzes"?: Array<StudentDashboardQuizItemDto> | null;
};

export type StudentDashboardSummaryDto = {
  "enrolledCourses"?: number;
  "upcomingLiveSessions"?: number;
  "pendingQuizzes"?: number;
};

export type SubmitQuizAttemptDto = {
  "answers": Array<SubmitStudentAnswerDto>;
};

export type SubmitStudentAnswerDto = {
  "questionId": string;
  "selectedOptionIds"?: Array<string> | null;
  "answerText"?: string | null;
  "fileReference"?: string | null;
};

export type SuspendUserDto = {
  "userId"?: string | null;
  "reason"?: string | null;
};

export type TeacherDashboardCourseItemDto = {
  "courseId"?: string;
  "title"?: string | null;
  "students"?: number;
  "averageProgressPercent"?: number;
  "status"?: string | null;
};

export type TeacherDashboardLiveSessionItemDto = {
  "sessionId"?: string;
  "courseId"?: string | null;
  "title"?: string | null;
  "startTime"?: string;
  "courseTitle"?: string | null;
  "durationMinutes"?: number | null;
  "studentsEnrolled"?: number;
  "status"?: LiveSessionStatus;
};

export type TeacherDashboardPerformanceDto = {
  "excellentPercentage"?: number;
  "goodPercentage"?: number;
  "averagePercentage"?: number;
  "needsImprovementPercentage"?: number;
};

export type TeacherDashboardResponseDto = {
  "summary"?: TeacherDashboardSummaryDto;
  "myCourses"?: Array<TeacherDashboardCourseItemDto> | null;
  "performance"?: TeacherDashboardPerformanceDto;
  "completionRates"?: Array<CourseCompletionRateItemDto> | null;
  "upcomingLiveSessions"?: Array<TeacherDashboardLiveSessionItemDto> | null;
  "pendingSubmissions"?: Array<TeacherDashboardSubmissionItemDto> | null;
};

export type TeacherDashboardSubmissionItemDto = {
  "assignmentId"?: string;
  "assignmentTitle"?: string | null;
  "courseTitle"?: string | null;
  "dueDate"?: string;
  "pendingCount"?: number;
  "totalCount"?: number;
};

export type TeacherDashboardSummaryDto = {
  "myCourses"?: number;
  "totalStudents"?: number;
  "pendingSubmissions"?: number;
  "upcomingLiveSessions"?: number;
};

export type UpdateLiveSessionRequestDto = {
  "title": string;
  "description"?: string | null;
  "startTime": string;
  "durationMinutes"?: number;
  "status"?: LiveSessionStatus;
  "recordingEnabled"?: boolean;
  "playbackEnabled"?: boolean;
  "acsRoomId"?: string | null;
  "acsCallLocator"?: string | null;
  "chatThreadId"?: string | null;
};

export type UpdateMyProfileRequest = {
  "firstName"?: string | null;
  "lastName"?: string | null;
  "phone"?: string | null;
};

export type UpdateQuestionDto = {
  "text": string;
  "type": QuestionType;
  "marks"?: number;
  "orderIndex"?: number;
  "options"?: Array<QuestionOptionRequestDto> | null;
};

export type UpdateQuizDto = {
  "title": string;
  "description"?: string | null;
  "durationMinutes"?: number;
  "startTimeUtc"?: string;
  "endTimeUtc"?: string;
  "totalMarks"?: number;
  "randomizeQuestions"?: boolean;
  "allowMultipleAttempts"?: boolean;
  "isPublished"?: boolean;
  "areResultsPublished"?: boolean;
};

export type UserProfileRequest = {
  "id"?: string | null;
  "email"?: string | null;
  "firstName"?: string | null;
  "lastName"?: string | null;
  "phone"?: string | null;
  "profileImageUrl"?: string | null;
  "status"?: UserStatus;
  "createdAt"?: string;
  "lastLoginAt"?: string | null;
};

export type UserStatus = 1 | 3;
