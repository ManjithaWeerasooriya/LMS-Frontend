import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import {
  LIVE_SESSION_STATUS,
  type TeacherLiveSession,
} from '@/features/teacher/live-sessions/api';
import { LiveSessionListTable } from '@/features/teacher/live-sessions/components/LiveSessionListTable';

const scheduledSession: TeacherLiveSession = {
  id: 'session-1',
  courseId: 'course-1',
  courseTitle: 'Advanced English',
  title: 'Live grammar workshop',
  description: 'Practice article usage and sentence patterns.',
  startTime: '2026-04-24T09:00:00Z',
  durationMinutes: 90,
  status: LIVE_SESSION_STATUS.scheduled,
  recordingEnabled: true,
  playbackEnabled: false,
};

const cancelledSession: TeacherLiveSession = {
  ...scheduledSession,
  id: 'session-2',
  title: 'Cancelled speaking lab',
  status: LIVE_SESSION_STATUS.cancelled,
};

describe('Teacher live-session list table', () => {
  it('renders row actions and forwards scheduled session events', async () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(
      <LiveSessionListTable
        sessions={[scheduledSession]}
        onEdit={onEdit}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText(/live grammar workshop/i)).toBeInTheDocument();
    expect(screen.getByText(/enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(onEdit).toHaveBeenCalledWith(scheduledSession);

    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledWith(scheduledSession);
  });

  it('shows loading and empty states', () => {
    const { rerender } = render(
      <LiveSessionListTable
        sessions={[]}
        isLoading
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/loading live sessions/i)).toBeInTheDocument();

    rerender(
      <LiveSessionListTable
        sessions={[]}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/no live sessions scheduled/i)).toBeInTheDocument();
  });

  it('disables edit and cancel controls when the session is no longer schedulable', () => {
    render(
      <LiveSessionListTable
        sessions={[cancelledSession]}
        cancellingSessionId="session-2"
        onEdit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^edit$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelling/i })).toBeDisabled();
  });
});
