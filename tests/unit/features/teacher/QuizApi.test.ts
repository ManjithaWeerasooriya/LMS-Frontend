import { getTeacherQuizById } from '@/features/teacher/quizzes/api';
import { toDateTimeLocalInput } from '@/features/teacher/quizzes/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@/lib/http', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const toExpectedLocalInput = (value: string) => {
  const parsed = new Date(value);
  const offset = parsed.getTimezoneOffset();
  return new Date(parsed.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

describe('teacher quiz api', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('normalizes quiz availability timestamps that omit the UTC timezone suffix', async () => {
    mockGet.mockResolvedValue({
      data: {
        quiz: {
          id: 'quiz-1',
          courseId: 'course-1',
          courseTitle: 'Grammar',
          title: 'Availability check',
          startTimeUtc: '2026-04-10T03:30:00',
          endTimeUtc: '2026-04-10T04:15:00',
        },
      },
    });

    const quiz = await getTeacherQuizById('quiz-1');

    expect(quiz.startTimeUtc).toBe('2026-04-10T03:30:00Z');
    expect(quiz.endTimeUtc).toBe('2026-04-10T04:15:00Z');
    expect(toDateTimeLocalInput(quiz.startTimeUtc)).toBe(
      toExpectedLocalInput('2026-04-10T03:30:00Z'),
    );
    expect(toDateTimeLocalInput(quiz.endTimeUtc)).toBe(
      toExpectedLocalInput('2026-04-10T04:15:00Z'),
    );
  });
});
