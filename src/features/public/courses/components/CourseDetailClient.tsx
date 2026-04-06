'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react';

import { enrollInStudentCourse, getMyStudentCourses, StudentApiError } from '@/features/student/api/student';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { Course } from '@/lib/courses';
import { withRedirect } from '@/lib/navigation';

import { buildLearningPoints, formatCourseDuration, formatCoursePrice } from '../utils';

type CourseDetailClientProps = {
  course: Course | null;
  error: string | null;
};

type MessageState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

function MessageBanner({ message }: { message: MessageState }) {
  if (!message) return null;

  const toneClasses =
    message.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : message.tone === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-blue-200 bg-blue-50 text-blue-800';

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>{message.text}</div>;
}

export function CourseDetailClient({ course, error }: CourseDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthSession();
  const [statusMessage, setStatusMessage] = useState<MessageState>(null);
  const [toast, setToast] = useState<MessageState>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const learningPoints = useMemo(() => (course ? buildLearningPoints(course) : []), [course]);
  const loginHref = withRedirect('/login', pathname);
  const registerHref = withRedirect('/register/student', pathname);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!course) return;

    if (!session.isAuthenticated) {
      setIsCheckingEnrollment(false);
      setIsEnrolled(false);
      setStatusMessage(null);
      return;
    }

    if (session.role !== 'Student') {
      setIsCheckingEnrollment(false);
      setIsEnrolled(false);
      setStatusMessage({
        tone: 'info',
        text: 'Enrollment is available for student accounts only.',
      });
      return;
    }

    let isMounted = true;
    setIsCheckingEnrollment(true);

    void getMyStudentCourses()
      .then((studentCourses) => {
        if (!isMounted) return;
        const enrolled = studentCourses.some((studentCourse) => studentCourse.id === course.id);
        setIsEnrolled(enrolled);
        setStatusMessage(
          enrolled
            ? {
                tone: 'success',
                text: 'You are already enrolled in this course.',
              }
            : null,
        );
      })
      .catch((loadError) => {
        if (!isMounted) return;

        if (loadError instanceof StudentApiError && (loadError.status === 401 || loadError.status === 403)) {
          setStatusMessage({
            tone: 'error',
            text: 'Your session could not be verified. Sign in again to continue enrollment.',
          });
          return;
        }

        setStatusMessage({
          tone: 'error',
          text: 'Unable to confirm your enrollment status right now.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsCheckingEnrollment(false);
      });

    return () => {
      isMounted = false;
    };
  }, [course, session.isAuthenticated, session.role]);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-rose-900">Course unavailable</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-800">{error}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="inline-flex items-center rounded-2xl bg-rose-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
            >
              Back to catalog
            </Link>
            <Link
              href={pathname}
              className="inline-flex items-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-900 transition hover:bg-rose-100"
            >
              Retry
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-950">Course not found</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            The course you requested could not be found. It may have been removed or is no longer
            publicly available.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse all courses
          </Link>
        </section>
      </main>
    );
  }

  const handleEnroll = async () => {
    if (isSubmitting || isEnrolled) return;

    if (!session.isAuthenticated) {
      router.push(loginHref);
      return;
    }

    if (session.role !== 'Student') {
      const message = 'Your current account cannot enroll in student courses.';
      setStatusMessage({ tone: 'error', text: message });
      setToast({ tone: 'error', text: message });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await enrollInStudentCourse(course.id);
      const message = 'Enrollment successful. This course is now available from your student dashboard.';
      setIsEnrolled(true);
      setStatusMessage({ tone: 'success', text: message });
      setToast({ tone: 'success', text: message });
    } catch (submitError) {
      if (submitError instanceof StudentApiError) {
        if (submitError.status === 401) {
          router.push(loginHref);
          return;
        }

        if (submitError.status === 409 || /already|enrolled/i.test(submitError.message)) {
          const message = 'You are already enrolled in this course.';
          setIsEnrolled(true);
          setStatusMessage({ tone: 'success', text: message });
          setToast({ tone: 'info', text: message });
          return;
        }

        const message =
          submitError.status === 403
            ? submitError.message || 'Your account is not permitted to enroll in this course.'
            : submitError.message || 'Unable to enroll right now. Please try again.';

        setStatusMessage({ tone: 'error', text: message });
        setToast({ tone: 'error', text: message });
      } else {
        const message = 'Unable to enroll right now. Please try again.';
        setStatusMessage({ tone: 'error', text: message });
        setToast({ tone: 'error', text: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLabel = !session.isAuthenticated
    ? 'Login to enroll'
    : session.role !== 'Student'
      ? 'Student account required'
      : isEnrolled
        ? 'Enrolled'
        : isCheckingEnrollment
          ? 'Checking enrollment...'
          : isSubmitting
            ? 'Enrolling...'
            : 'Enroll now';

  const actionDisabled =
    session.isAuthenticated && session.role !== 'Student'
      ? true
      : isEnrolled || isCheckingEnrollment || isSubmitting;

  return (
    <main className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_35%,#f8fafc_100%)]">
      {toast ? (
        <div className="fixed right-4 top-20 z-50 max-w-sm">
          <MessageBanner message={toast} />
        </div>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <div className="space-y-8">
            <section className="rounded-[34px] border border-white/80 bg-white/90 p-7 shadow-[0_26px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-9">
              <div className="flex flex-wrap items-center gap-3">
                {course.tags.length > 0 ? (
                  course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Course
                  </span>
                )}
                {course.status ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {course.status}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {course.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                {course.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <UserRound className="h-4 w-4" />
                    Instructor
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {course.teacherName ?? 'Instructor assigned soon'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Duration
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCourseDuration(course.durationHours)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Tag className="h-4 w-4" />
                    Price
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{formatCoursePrice(course.price)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <GraduationCap className="h-4 w-4" />
                    Enrollment
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {course.studentsEnrolled != null ? `${course.studentsEnrolled} learners` : 'Open now'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-950">About this course</h2>
              <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
                <div className="space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
                  <p>{course.description}</p>
                  <p>
                    {course.category
                      ? `${course.title} is part of the ${course.category} track and is designed to give learners a clearer, more structured path through the material.`
                      : `${course.title} follows a structured format designed to keep the learning path clear and manageable.`}
                  </p>
                </div>

                <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Difficulty</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {course.difficultyLevel ?? 'All levels'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prerequisites</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {course.prerequisites ?? 'No specific prerequisites listed.'}
                    </p>
                  </div>
                  {course.maxStudents != null ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Class size</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">Up to {course.maxStudents} learners</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-950">What you will learn</h2>
              <div className="mt-6 grid gap-4">
                {learningPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-950">Instructor</h2>
              <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      {course.teacherName ?? 'Genuine English Faculty'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Course instructor</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    <ShieldCheck className="h-4 w-4" />
                    Guided learning
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  This course is delivered through the Genuine English platform with a guided structure,
                  clear checkpoints, and a student-first enrollment flow.
                </p>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Enrollment</p>
                <h2 className="mt-3 text-3xl font-semibold">
                  {isEnrolled ? 'You are enrolled.' : formatCoursePrice(course.price)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {isEnrolled
                    ? 'Your enrollment is active. Open your dashboard to continue learning.'
                    : 'Stay on this page while enrolling. Unauthenticated visitors are redirected to sign in and returned here afterward.'}
                </p>
              </div>

              <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <span>Category</span>
                  <span className="font-semibold text-white">{course.category ?? 'General'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Duration</span>
                  <span className="font-semibold text-white">{formatCourseDuration(course.durationHours)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Status</span>
                  <span className="font-semibold text-white">{isEnrolled ? 'Enrolled' : 'Open for enrollment'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {isEnrolled ? (
                  <Link
                    href="/student/dashboard"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Go to course dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={actionDisabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {actionLabel}
                  </button>
                )}

                {!session.isAuthenticated ? (
                  <Link
                    href={registerHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                  >
                    Register as student
                  </Link>
                ) : null}
              </div>

              <MessageBanner message={statusMessage} />

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Enrollment actions & status
                </h3>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                  <li>Public visitors can read course details without signing in.</li>
                  <li>Student accounts can enroll directly from this page.</li>
                  <li>Duplicate enrollments are blocked and shown as enrolled.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
