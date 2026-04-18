'use client';

import type { LiveSessionAttendanceSummary } from '@/features/live-classroom/api';
import { formatLiveClassroomDateTime } from '@/features/live-classroom/utils';
import { LiveSessionAttendanceSummaryView } from '@/features/live-classroom/components/LiveSessionAttendanceSummaryView';

type LiveSessionAttendanceModalProps = {
  open: boolean;
  isLoading: boolean;
  error: string | null;
  summary: LiveSessionAttendanceSummary | null;
  onClose: () => void;
  onRefresh: () => void;
};

export function LiveSessionAttendanceModal({
  open,
  isLoading,
  error,
  summary,
  onClose,
  onRefresh,
}: LiveSessionAttendanceModalProps) {
  if (!open) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Attendance
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              {summary?.sessionTitle ?? 'Live session attendance'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {summary
                ? `${formatLiveClassroomDateTime(summary.startTime)} · ${summary.courseTitle}`
                : 'Review who joined the classroom and how long they stayed.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close attendance"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">
          <LiveSessionAttendanceSummaryView
            isLoading={isLoading}
            error={error}
            summary={summary}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}
