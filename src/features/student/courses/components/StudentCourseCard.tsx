'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Gauge, UserRound } from 'lucide-react';

import type { StudentCourseListItem } from '@/features/student/api/student';

type StudentCourseCardProps = {
  course: StudentCourseListItem;
};

const formatProgress = (value: number | null) => {
  if (value == null) return null;
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}% complete`;
};

const getCourseInitials = (title: string) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'GE';

export function StudentCourseCard({ course }: StudentCourseCardProps) {
  const progressLabel = formatProgress(course.progressPercent);
  const previewStyle = course.thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(140deg, rgba(15, 23, 42, 0.14), rgba(27, 59, 139, 0.68)), url("${course.thumbnailUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <Link
      href={`/student/dashboard/courses/${course.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)]"
    >
      <div
        className={`relative flex h-44 items-end overflow-hidden px-5 py-4 ${
          course.thumbnailUrl
            ? 'bg-slate-900 text-white'
            : 'bg-[linear-gradient(135deg,#dbeafe_0%,#eff6ff_45%,#f8fafc_100%)] text-slate-900'
        }`}
        style={previewStyle}
      >
        {!course.thumbnailUrl ? (
          <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/70 text-lg font-semibold shadow-sm backdrop-blur">
            {getCourseInitials(course.title)}
          </div>
        ) : null}

        <div className="relative max-w-[85%]">
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${course.thumbnailUrl ? 'text-blue-100' : 'text-blue-700'}`}>
            {course.category ?? 'Course'}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{course.title}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-6 text-slate-600">
          {course.description ?? 'Open this course to view weekly materials and quizzes.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {course.instructorName ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <UserRound className="h-3.5 w-3.5" />
              {course.instructorName}
            </span>
          ) : null}

          {progressLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Gauge className="h-3.5 w-3.5" />
              {progressLabel}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <BookOpen className="h-3.5 w-3.5" />
            Enrolled
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-900">
          <span>Open course</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
