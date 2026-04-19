'use client';

import { Users } from 'lucide-react';

import { ErrorAlert } from '@/components/ErrorAlert';
import type { LiveSessionAttendanceSummary } from '@/features/live-classroom/api';
import {
  formatAttendanceDuration,
  formatLiveClassroomDateTime,
  getAttendanceStatusMeta,
} from '@/features/live-classroom/utils';
import { QuizMetricCard } from '@/features/teacher/quizzes/components/QuizShared';

type LiveSessionAttendanceSummaryViewProps = {
  isLoading: boolean;
  error: string | null;
  summary: LiveSessionAttendanceSummary | null;
  onRefresh: () => void;
};

export function LiveSessionAttendanceSummaryView({
  isLoading,
  error,
  summary,
  onRefresh,
}: LiveSessionAttendanceSummaryViewProps) {
  return (
    <div className="space-y-5">
      <ErrorAlert message={error ?? ''} />

      <div className="grid gap-4 md:grid-cols-3">
        <QuizMetricCard
          label="Enrolled"
          value={summary ? String(summary.totalEnrolledStudents) : '—'}
        />
        <QuizMetricCard
          label="Joined"
          value={summary ? String(summary.totalJoinedStudents) : '—'}
        />
        <QuizMetricCard
          label="Completed"
          value={summary ? String(summary.totalCompletedAttendances) : '—'}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          Loading attendance…
        </div>
      ) : !summary ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
            <Users className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Attendance data unavailable
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The attendance summary could not be loaded for this session.
          </p>
        </div>
      ) : summary.students.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No attendance records have been captured for this session yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Left</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.students.map((student) => {
                  const status = getAttendanceStatusMeta(student.attendanceStatus);

                  return (
                    <tr key={student.id ?? `${student.studentId}-${student.joinTime ?? 'pending'}`}>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">
                            {student.studentName ?? 'Student'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.studentEmail ?? student.studentId}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatLiveClassroomDateTime(student.joinTime)}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatLiveClassroomDateTime(student.leaveTime)}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatAttendanceDuration(student.durationSeconds)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
