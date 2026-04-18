'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { TeacherLiveSession } from '@/features/teacher/live-sessions/api';
import {
  formatDurationMinutes,
  formatLiveSessionDateTime,
  formatLiveSessionDayHeading,
  formatLiveSessionMonth,
  formatLiveSessionTimeRange,
  getLiveSessionStatusMeta,
  toDateKey,
} from '@/features/teacher/live-sessions/utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfMonth = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1);

const isSameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const buildCalendarDays = (
  month: Date,
  sessionsByDate: Record<string, TeacherLiveSession[]>,
) => {
  const firstDayOfMonth = startOfMonth(month);
  const firstGridDay = new Date(firstDayOfMonth);
  firstGridDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    const key = toDateKey(date);

    return {
      key,
      date,
      inCurrentMonth: isSameMonth(date, month),
      sessions: sessionsByDate[key] ?? [],
    };
  });
};

export function LiveSessionCalendar({ sessions }: { sessions: TeacherLiveSession[] }) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const initializedFromSessionsRef = useRef(false);

  useEffect(() => {
    if (sessions.length === 0 || initializedFromSessionsRef.current) {
      return;
    }

    const firstSessionDate = new Date(sessions[0].startTime);
    if (Number.isNaN(firstSessionDate.getTime())) {
      return;
    }

    setVisibleMonth(startOfMonth(firstSessionDate));
    setSelectedDateKey(toDateKey(firstSessionDate));
    initializedFromSessionsRef.current = true;
  }, [sessions]);

  const sessionsByDate: Record<string, TeacherLiveSession[]> = {};
  for (const session of sessions) {
    const key = toDateKey(session.startTime);
    if (!key) continue;
    if (!sessionsByDate[key]) {
      sessionsByDate[key] = [];
    }
    sessionsByDate[key].push(session);
  }

  for (const sessionList of Object.values(sessionsByDate)) {
    sessionList.sort(
      (left, right) =>
        new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
    );
  }

  const calendarDays = buildCalendarDays(visibleMonth, sessionsByDate);
  const activeDay =
    calendarDays.find((day) => day.key === selectedDateKey) ??
    calendarDays.find((day) => day.sessions.length > 0 && day.inCurrentMonth) ??
    null;

  let monthSessionCount = 0;
  for (const session of sessions) {
    const sessionDate = new Date(session.startTime);
    if (!Number.isNaN(sessionDate.getTime()) && isSameMonth(sessionDate, visibleMonth)) {
      monthSessionCount += 1;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {formatLiveSessionMonth(visibleMonth)}
          </h3>
          <p className="text-sm text-slate-500">
            {monthSessionCount === 0
              ? 'No sessions in this month.'
              : `${monthSessionCount} session${monthSessionCount === 1 ? '' : 's'} scheduled.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 pb-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day) => {
            const isSelected = activeDay?.key === day.key;
            const isToday = toDateKey(new Date()) === day.key;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDateKey(day.key)}
                className={`min-h-28 rounded-3xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : day.inCurrentMonth
                      ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      : 'border-slate-100 bg-slate-50/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday && !isSelected
                        ? 'bg-slate-900 text-white'
                        : isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.sessions.length > 0 ? (
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-blue-700">
                      {day.sessions.length}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-1">
                  {day.sessions.slice(0, 2).map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700"
                    >
                      {session.title}
                    </div>
                  ))}
                  {day.sessions.length > 2 ? (
                    <p className="text-[11px] font-medium text-slate-500">
                      +{day.sessions.length - 2} more
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {activeDay ? formatLiveSessionDayHeading(activeDay.date) : 'Select a day'}
          </h3>
          <p className="text-sm text-slate-500">
            {activeDay?.sessions.length
              ? `${activeDay.sessions.length} session${activeDay.sessions.length === 1 ? '' : 's'} on this day.`
              : 'No sessions scheduled for this day.'}
          </p>
        </div>

        {activeDay?.sessions.length ? (
          <div className="mt-4 space-y-3">
            {activeDay.sessions.map((session) => {
              const status = getLiveSessionStatusMeta(session.status);

              return (
                <div
                  key={session.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{session.title}</h4>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {session.description || 'No session description provided.'}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p>{formatLiveSessionDateTime(session.startTime)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatLiveSessionTimeRange(
                          session.startTime,
                          session.durationMinutes,
                        )}{' '}
                        · {formatDurationMinutes(session.durationMinutes)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
