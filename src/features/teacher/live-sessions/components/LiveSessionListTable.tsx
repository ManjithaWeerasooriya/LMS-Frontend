'use client';

import Link from 'next/link';
import { PencilLine, Trash2 } from 'lucide-react';

import type { TeacherLiveSession } from '@/features/teacher/live-sessions/api';
import {
  canCancelLiveSession,
  canEditLiveSession,
  formatDurationMinutes,
  formatLiveSessionDate,
  formatLiveSessionTimeRange,
  getLiveSessionStatusMeta,
} from '@/features/teacher/live-sessions/utils';

type LiveSessionListTableProps = {
  sessions: TeacherLiveSession[];
  isLoading?: boolean;
  emptyMessage?: string;
  cancellingSessionId?: string | null;
  getClassroomHref?: (session: TeacherLiveSession) => string;
  onEdit: (session: TeacherLiveSession) => void;
  onCancel: (session: TeacherLiveSession) => void;
};

const ToggleBadge = ({
  enabled,
  enabledLabel,
  disabledLabel,
}: {
  enabled: boolean;
  enabledLabel: string;
  disabledLabel: string;
}) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}
  >
    {enabled ? enabledLabel : disabledLabel}
  </span>
);

export function LiveSessionListTable({
  sessions,
  isLoading = false,
  emptyMessage = 'No live sessions scheduled for this course.',
  cancellingSessionId,
  getClassroomHref,
  onEdit,
  onCancel,
}: LiveSessionListTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Session</th>
              <th className="px-6 py-3">Start</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3">Recording</th>
              <th className="px-6 py-3">Playback</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  Loading live sessions…
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const status = getLiveSessionStatusMeta(session.status);
                const canEdit = canEditLiveSession(session.status);
                const canCancel = canCancelLiveSession(session.status);
                const classroomHref = getClassroomHref?.(session);

                return (
                  <tr key={session.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                        <p className="text-xs text-slate-500">
                          {session.description || 'No session description provided.'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p>{formatLiveSessionDate(session.startTime)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatLiveSessionTimeRange(
                          session.startTime,
                          session.durationMinutes,
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDurationMinutes(session.durationMinutes)}
                    </td>
                    <td className="px-6 py-4">
                      <ToggleBadge
                        enabled={session.recordingEnabled}
                        enabledLabel="Enabled"
                        disabledLabel="Off"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ToggleBadge
                        enabled={session.playbackEnabled}
                        enabledLabel="Enabled"
                        disabledLabel="Off"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {classroomHref ? (
                          <Link
                            href={classroomHref}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B3B8B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#17306f]"
                          >
                            Classroom
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onEdit(session)}
                          disabled={!canEdit || cancellingSessionId === session.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancel(session)}
                          disabled={!canCancel || cancellingSessionId === session.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {cancellingSessionId === session.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
