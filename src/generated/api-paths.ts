/* tslint:disable */
/**
 * This file is auto-generated from docs/api/swagger.json.
 * Do not edit manually. Run `npm run generate:api-types` instead.
 */

export const apiPaths = {
  "/api/Materials/{id}": "/api/Materials/{id}",
  "/api/Materials/{id}/download": "/api/Materials/{id}/download",
  "/api/Materials/course/{courseId}": "/api/Materials/course/{courseId}",
  "/api/Materials/upload": "/api/Materials/upload",
  "/api/public/courses": "/api/public/courses",
  "/api/public/courses/{id}": "/api/public/courses/{id}",
  "/api/public/stats": "/api/public/stats",
  "/api/v1/admin/courses": "/api/v1/admin/courses",
  "/api/v1/admin/courses/{id}": "/api/v1/admin/courses/{id}",
  "/api/v1/admin/courses/{id}/disable": "/api/v1/admin/courses/{id}/disable",
  "/api/v1/admin/reports/courses": "/api/v1/admin/reports/courses",
  "/api/v1/admin/reports/overview": "/api/v1/admin/reports/overview",
  "/api/v1/admin/reports/quizzes": "/api/v1/admin/reports/quizzes",
  "/api/v1/admin/users": "/api/v1/admin/users",
  "/api/v1/admin/users/{id}/reactivate": "/api/v1/admin/users/{id}/reactivate",
  "/api/v1/admin/users/{id}/suspend": "/api/v1/admin/users/{id}/suspend",
  "/api/v1/Auth/confirm-email": "/api/v1/Auth/confirm-email",
  "/api/v1/Auth/forgot-password": "/api/v1/Auth/forgot-password",
  "/api/v1/Auth/login": "/api/v1/Auth/login",
  "/api/v1/Auth/logout": "/api/v1/Auth/logout",
  "/api/v1/Auth/refresh": "/api/v1/Auth/refresh",
  "/api/v1/Auth/register": "/api/v1/Auth/register",
  "/api/v1/Auth/resend-verification": "/api/v1/Auth/resend-verification",
  "/api/v1/Auth/reset-password": "/api/v1/Auth/reset-password",
  "/api/v1/Demo/me": "/api/v1/Demo/me",
  "/api/v1/Demo/public": "/api/v1/Demo/public",
  "/api/v1/Demo/secure": "/api/v1/Demo/secure",
  "/api/v1/Demo/student": "/api/v1/Demo/student",
  "/api/v1/Demo/teacher": "/api/v1/Demo/teacher",
  "/api/v1/student/courses": "/api/v1/student/courses",
  "/api/v1/student/courses/{courseId}/enroll": "/api/v1/student/courses/{courseId}/enroll",
  "/api/v1/student/courses/my": "/api/v1/student/courses/my",
  "/api/v1/student/dashboard": "/api/v1/student/dashboard",
  "/api/v1/student/quizzes": "/api/v1/student/quizzes",
  "/api/v1/student/quizzes/{quizId}": "/api/v1/student/quizzes/{quizId}",
  "/api/v1/student/quizzes/{quizId}/attempts": "/api/v1/student/quizzes/{quizId}/attempts",
  "/api/v1/student/quizzes/attempts/{attemptId}": "/api/v1/student/quizzes/attempts/{attemptId}",
  "/api/v1/student/quizzes/attempts/{attemptId}/submit": "/api/v1/student/quizzes/attempts/{attemptId}/submit",
  "/api/v1/teacher/courses": "/api/v1/teacher/courses",
  "/api/v1/teacher/courses/{id}": "/api/v1/teacher/courses/{id}",
  "/api/v1/teacher/dashboard": "/api/v1/teacher/dashboard",
  "/api/v1/teacher/live-classes": "/api/v1/teacher/live-classes",
  "/api/v1/teacher/quizzes": "/api/v1/teacher/quizzes",
  "/api/v1/teacher/quizzes/{quizId}": "/api/v1/teacher/quizzes/{quizId}",
  "/api/v1/teacher/quizzes/{quizId}/analytics": "/api/v1/teacher/quizzes/{quizId}/analytics",
  "/api/v1/teacher/quizzes/{quizId}/attempts": "/api/v1/teacher/quizzes/{quizId}/attempts",
  "/api/v1/teacher/quizzes/{quizId}/attempts/{attemptId}": "/api/v1/teacher/quizzes/{quizId}/attempts/{attemptId}",
  "/api/v1/teacher/quizzes/{quizId}/attempts/{attemptId}/answers/{answerId}/grade": "/api/v1/teacher/quizzes/{quizId}/attempts/{attemptId}/answers/{answerId}/grade",
  "/api/v1/teacher/quizzes/{quizId}/questions": "/api/v1/teacher/quizzes/{quizId}/questions",
  "/api/v1/teacher/quizzes/{quizId}/questions/{questionId}": "/api/v1/teacher/quizzes/{quizId}/questions/{questionId}",
  "/api/v1/teacher/quizzes/{quizId}/results/publish": "/api/v1/teacher/quizzes/{quizId}/results/publish",
  "/api/v1/teacher/quizzes/{quizId}/results/unpublish": "/api/v1/teacher/quizzes/{quizId}/results/unpublish",
  "/api/v1/teacher/quizzes/course/{courseId}": "/api/v1/teacher/quizzes/course/{courseId}",
  "/api/v1/Users/confirm-delete": "/api/v1/Users/confirm-delete",
  "/api/v1/Users/me": "/api/v1/Users/me",
  "/api/v1/Users/me/change-password": "/api/v1/Users/me/change-password",
  "/api/v1/Users/me/delete-request": "/api/v1/Users/me/delete-request",
} as const;

export type ApiPathKey = keyof typeof apiPaths;

export const resolveApiPath = <T extends ApiPathKey>(path: T): T => apiPaths[path] as unknown as T;

export const buildApiPath = <T extends ApiPathKey>(
  template: T,
  params: Record<string, string | number>,
): string => {
  let resolved = apiPaths[template] as string;

  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(String(value)));
  }

  if (/\{[^}]+\}/.test(resolved)) {
    throw new Error(`Missing path params for ${template}: ${resolved}`);
  }

  return resolved;
};
