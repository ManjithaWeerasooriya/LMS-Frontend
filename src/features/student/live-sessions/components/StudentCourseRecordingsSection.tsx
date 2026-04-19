'use client';

import Link from 'next/link';
import { PlayCircle, Video } from 'lucide-react';
import { useMemo } from 'react';

import type { StudentLiveSession } from '@/features/student/live-sessions/api';
import {
  LIVE_CLASSROOM_RECORDING_STATUS,
  formatDurationLabel,
  formatLiveClassroomDateTime,
  getRecordingStatusMeta,
} from '@/features/live-classroom/utils';
import {
  QuizMetricCard,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';

type StudentCourseRecordingsSectionProps = {
  courseId: string;
  sessions: StudentLiveSession[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

const canAppearInRecordingsList = (session: StudentLiveSession) =>
  session.recordingEnabled ||
  session.playbackEnabled ||
  session.recordingStatus !== LIVE_CLASSROOM_RECORDING_STATUS.notStarted ||
  Boolean(session.acsRecordingId) ||
  Boolean(session.recordingUrl);

const isRecordingAvailable = (session: StudentLiveSession) =>
  session.playbackEnabled &&
  session.recordingStatus === LIVE_CLASSROOM_RECORDING_STATUS.available;

export function StudentCourseRecordingsSection({
  courseId,
  sessions,
  isLoading,
  error,
  onRetry,
}: StudentCourseRecordingsSectionProps) {
  const recordingSessions = useMemo(
    () =>
      [...sessions]
        .filter(canAppearInRecordingsList)
        .sort(
          (left, right) =>
            new Date(right.startTime).getTime() - new Date(left.startTime).getTime(),
        ),
    [sessions],
  );

  const latestRecording = recordingSessions[0] ?? null;
  const availableCount = recordingSessions.filter(isRecordingAvailable).length;

  return (
    <QuizSectionCard
      title="Recordings"
      description="Review classroom recordings for this course and open playback when it becomes available."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <QuizMetricCard label="Recorded Sessions" value={String(recordingSessions.length)} />
          <QuizMetricCard label="Available" value={String(availableCount)} />
          <QuizMetricCard
            label="Latest"
            value={latestRecording ? formatLiveClassroomDateTime(latestRecording.startTime) : '—'}
            hint={latestRecording ? latestRecording.title : 'No recordings yet'}
          />
        </div>

        {isLoading ? (
          <QuizStatePanel
            title="Loading recordings"
            message="Fetching course recording metadata from the student live-session endpoints."
          />
        ) : error && recordingSessions.length === 0 ? (
          <QuizStatePanel
            title="Recordings unavailable"
            message="The course recordings list could not be loaded right now."
            tone="error"
            action={
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#17306f]"
              >
                Retry
              </button>
            }
          />
        ) : recordingSessions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
              <Video className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No recordings yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Recordings will appear here after recorded live sessions finish processing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordingSessions.map((session) => {
              const recordingStatus = getRecordingStatusMeta(session.recordingStatus);
              const available = isRecordingAvailable(session);

              return (
                <article
                  key={session.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${recordingStatus.className}`}
                        >
                          {recordingStatus.label}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            session.playbackEnabled
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {session.playbackEnabled ? 'Playback enabled' : 'Playback unavailable'}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-slate-500">
                        {session.description || 'No session description provided.'}
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                          <Video className="h-4 w-4 text-blue-700" />
                          {formatLiveClassroomDateTime(session.startTime)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                          Duration · {formatDurationLabel(session.durationMinutes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/student/dashboard/courses/${courseId}/live-sessions/${session.id}/recording`}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                          available
                            ? 'bg-[#1B3B8B] text-white shadow-md hover:bg-[#17306f]'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {available ? 'Open playback' : 'View status'}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </QuizSectionCard>
  );
}
