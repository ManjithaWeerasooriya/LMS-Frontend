import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizListTable } from '@/features/teacher/quizzes/components/QuizListTable';
import type { TeacherQuizSummary } from '@/features/teacher/quizzes/types';
import { vi } from 'vitest';

const baseQuiz: TeacherQuizSummary = {
  id: 'quiz-1',
  title: 'Module 4 Checkpoint',
  durationMinutes: 25,
  submissionCount: 8,
  averageScorePercent: 76,
  questionCount: 5,
  totalMarks: 25,
  startTimeUtc: '2026-04-02T08:00:00Z',
  endTimeUtc: '2026-04-02T09:00:00Z',
  areResultsPublished: false,
  isPublished: true,
  createdAt: '2026-04-01T01:00:00Z',
};

describe('LMS-150 Quiz Edit/Delete workflow', () => {
  it('renders quiz rows with edit/review/delete actions wired to callbacks', async () => {
    const onDelete = vi.fn();
    const onToggleResults = vi.fn();

    render(
      <QuizListTable
        courseId="course-123"
        quizzes={[baseQuiz]}
        onDelete={onDelete}
        onToggleResults={onToggleResults}
      />,
    );

    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toHaveAttribute('href', expect.stringContaining('/course-123/'));

    await userEvent.click(screen.getByRole('button', { name: /publish results/i }));
    expect(onToggleResults).toHaveBeenCalledWith(baseQuiz);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(baseQuiz);
  });

  it('shows empty and loading states for QA visibility', () => {
    const { rerender } = render(
      <QuizListTable
        courseId="course-123"
        quizzes={[]}
        isLoading
        onDelete={vi.fn()}
        onToggleResults={vi.fn()}
      />,
    );

    expect(screen.getByText(/loading quizzes/i)).toBeInTheDocument();

    rerender(
      <QuizListTable
        courseId="course-123"
        quizzes={[]}
        onDelete={vi.fn()}
        onToggleResults={vi.fn()}
      />,
    );

    expect(screen.getByText(/no quizzes yet/i)).toBeInTheDocument();
  });

  it('disables destructive actions while an async operation is pending', async () => {
    render(
      <QuizListTable
        courseId="course-123"
        quizzes={[baseQuiz]}
        deletingQuizId="quiz-1"
        togglingResultsQuizId="quiz-1"
        onDelete={vi.fn()}
        onToggleResults={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });
});
