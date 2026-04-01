'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CirclePlus, FileText, Users } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import { getTeacherCourses, type TeacherCourse } from '@/features/teacher/api/teacher';
import { getTeacherQuizzesByCourse, getTeacherQuizErrorMessage } from '@/features/teacher/quizzes/api';
import {
  QuizMetricCard,
  QuizPageHeader,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type CourseQuizOverview = TeacherCourse & {
  quizCount: number;
};

export default function TeacherQuizCoursesPage() {
  const [courses, setCourses] = useState<CourseQuizOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const teacherCourses = await getTeacherCourses();
        const quizLists = await Promise.all(
          teacherCourses.map(async (course) => ({
            ...course,
            quizCount: (await getTeacherQuizzesByCourse(course.id)).length,
          })),
        );

        if (!active) return;
        setCourses(quizLists);
      } catch (loadError) {
        if (!active) return;
        setError(getTeacherQuizErrorMessage(loadError, 'Unable to load your quiz courses.'));
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
  }, []);

  const totals = useMemo(() => {
    return courses.reduce(
      (summary, course) => ({
        courseCount: summary.courseCount + 1,
        quizCount: summary.quizCount + course.quizCount,
        studentCount: summary.studentCount + course.students,
      }),
      { courseCount: 0, quizCount: 0, studentCount: 0 },
    );
  }, [courses]);

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Course Quizzes"
        title="Teacher Quiz Workspace"
        description="Select a course to create quizzes, add questions, review submissions, and release results."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <QuizMetricCard label="Courses" value={String(totals.courseCount)} hint="Courses you can assess" />
        <QuizMetricCard label="Quizzes" value={String(totals.quizCount)} hint="Total quiz shells created" />
        <QuizMetricCard label="Students" value={String(totals.studentCount)} hint="Learners across your courses" />
      </div>

      <ErrorAlert message={error ?? ''} />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Courses with quiz management</h2>
          <p className="text-sm text-slate-500">
            Quiz lists are scoped per course, matching the backend teacher routes.
          </p>
        </div>

        {isLoading ? (
          <QuizStatePanel
            title="Loading courses"
            message="Fetching courses and existing quiz counts."
          />
        ) : courses.length === 0 ? (
          <QuizStatePanel
            title="No courses available"
            message="Create a course first, then return here to start building quizzes."
            action={
              <Link
                href="/teacher/dashboard/courses"
                className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
              >
                Go to Courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                      {course.category || 'Course'}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                    <p className="text-sm text-slate-500">{course.status}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <FileText className="h-4 w-4" />
                      Quizzes
                    </div>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{course.quizCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <Users className="h-4 w-4" />
                      Students
                    </div>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{course.students}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/teacher/dashboard/courses/${course.id}/quizzes`}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Open Quiz List
                  </Link>
                  <Link
                    href={`/teacher/dashboard/courses/${course.id}/quizzes/new`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
                  >
                    <CirclePlus className="h-4 w-4" />
                    Create Quiz
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
