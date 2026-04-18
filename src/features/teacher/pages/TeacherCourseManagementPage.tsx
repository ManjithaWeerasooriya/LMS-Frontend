'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { getTeacherCourseById, type TeacherCourseDetail } from '@/features/teacher/api/teacher';
import { TeacherCourseLiveSessionsSection } from '@/features/teacher/live-sessions/components/TeacherCourseLiveSessionsSection';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type TeacherCourseManagementPageProps = {
  courseId: string;
};

export default function TeacherCourseManagementPage({
  courseId,
}: TeacherCourseManagementPageProps) {
  const [course, setCourse] = useState<TeacherCourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await getTeacherCourseById(courseId);
        if (!active) return;
        setCourse(detail);
      } catch {
        if (!active) return;
        setError('Unable to load the course management page.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [courseId]);

  const courseTitle = course?.title ?? 'Course';
  const courseDescription = course?.description?.trim() || 'No course description provided.';

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Course Management"
        title={isLoading ? 'Loading course…' : courseTitle}
        description="Manage course delivery, schedule live sessions, and jump to the quiz workspace without leaving the course context."
        backHref="/teacher/dashboard/courses"
        actions={
          isLoading || !course
            ? []
            : [
                {
                  label: 'Manage Quizzes',
                  href: `/teacher/dashboard/courses/${courseId}/quizzes`,
                  variant: 'secondary',
                },
                {
                  label: 'Create Quiz',
                  href: `/teacher/dashboard/courses/${courseId}/quizzes/new`,
                  variant: 'primary',
                },
              ]
        }
      >
        <BreadcrumbTrail
          items={[
            { label: 'Courses', href: '/teacher/dashboard/courses' },
            { label: courseTitle },
          ]}
        />
      </QuizPageHeader>

      <ErrorAlert message={error ?? ''} />

      {isLoading ? (
        <QuizStatePanel
          title="Loading course management"
          message="Fetching course details and live-session scheduling data."
        />
      ) : !course ? (
        <QuizStatePanel
          title="Course unavailable"
          message="This course could not be loaded for management. Return to the course list and try again."
          tone="error"
          action={
            <Link
              href="/teacher/dashboard/courses"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
            >
              Back to Courses
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuizMetricCard label="Status" value={course.status || '—'} />
            <QuizMetricCard
              label="Duration"
              value={`${course.durationHours || 0} hr`}
              hint="Configured course length"
            />
            <QuizMetricCard
              label="Capacity"
              value={String(course.maxStudents)}
              hint="Maximum enrolled students"
            />
            <QuizMetricCard
              label="Price"
              value={`Rs ${course.price.toFixed(2)}`}
              hint={course.category || 'Uncategorized'}
            />
          </div>

          <QuizSectionCard
            title="Course Overview"
            description="Reference the core course details while you manage delivery."
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
              <div>
                <p className="text-sm leading-7 text-slate-600">{courseDescription}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Difficulty
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {course.difficultyLevel || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Prerequisites
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {course.prerequisites || 'None listed'}
                  </p>
                </div>
              </div>
            </div>
          </QuizSectionCard>

          <TeacherCourseLiveSessionsSection courseId={courseId} courseTitle={courseTitle} />
        </>
      )}
    </div>
  );
}
