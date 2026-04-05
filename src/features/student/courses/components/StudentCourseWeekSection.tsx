'use client';

import { CalendarClock, ClipboardList, Clock3, Download, ExternalLink, FileText, FolderOpen } from 'lucide-react';

import type { CourseMaterial } from '@/features/student/materials/api/materials';
import type { StudentCourseQuiz, StudentCourseWeek } from '@/features/student/courses/api';

type StudentCourseWeekSectionProps = {
  week: StudentCourseWeek;
  onDownloadMaterial: (material: CourseMaterial) => Promise<void> | void;
};

const materialTypeLabel: Record<CourseMaterial['materialType'], string> = {
  pdf: 'PDF',
  video: 'Video',
  assignment: 'Assignment',
  other: 'File',
};

const formatDate = (value: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatAvailability = (quiz: StudentCourseQuiz) => {
  if (quiz.availabilityLabel) {
    return quiz.availabilityLabel;
  }

  const availableFrom = formatDate(quiz.availableFrom);
  const availableUntil = formatDate(quiz.availableUntil);

  if (availableFrom && availableUntil) {
    return `Available ${availableFrom} to ${availableUntil}`;
  }

  if (availableFrom) {
    return `Opens ${availableFrom}`;
  }

  if (availableUntil) {
    return `Closes ${availableUntil}`;
  }

  if (quiz.status) {
    return quiz.status;
  }

  return 'Availability to be announced';
};

export function StudentCourseWeekSection({
  week,
  onDownloadMaterial,
}: StudentCourseWeekSectionProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
            Learning Schedule
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{week.label}</h2>
        </div>
        {week.mappingLabel ? (
          <p className="text-sm text-slate-500">Mapped from: {week.mappingLabel}</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-700" />
            <h3 className="text-lg font-semibold text-slate-900">Materials</h3>
          </div>

          {week.materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No materials published for this week yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {week.materials.map((material) => (
                <article
                  key={`material-${material.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {materialTypeLabel[material.materialType]}
                      </span>
                      <h4 className="mt-3 text-base font-semibold text-slate-900">{material.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{material.fileName}</p>
                    </div>
                    {formatDate(material.uploadedAt) ? (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(material.uploadedAt)}
                      </span>
                    ) : null}
                  </div>

                  {material.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {material.fileUrl ? (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDownloadMaterial(material)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#1B3B8B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#17306f]"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Quizzes</h3>
          </div>

          {week.quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No quizzes scheduled for this week yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {week.quizzes.map((quiz) => (
                <article key={quiz.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Quiz
                      </span>
                      <h4 className="mt-3 text-base font-semibold text-slate-900">{quiz.title}</h4>
                    </div>
                    {quiz.durationMinutes ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        {quiz.durationMinutes} min
                      </span>
                    ) : null}
                  </div>

                  {quiz.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{quiz.description}</p>
                  ) : null}

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-start gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>{formatAvailability(quiz)}</span>
                    </p>
                    {quiz.questionCount != null ? (
                      <p className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{quiz.questionCount} questions</span>
                      </p>
                    ) : null}
                    {quiz.totalMarks != null ? (
                      <p className="flex items-start gap-2">
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{quiz.totalMarks} marks</span>
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
