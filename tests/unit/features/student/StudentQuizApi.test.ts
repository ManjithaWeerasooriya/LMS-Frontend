import { getStudentQuizzes } from '@/features/student/quizzes/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@/lib/http', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('student quiz api', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('normalizes quiz availability timestamps that omit the UTC timezone suffix', async () => {
    mockGet.mockResolvedValue({
      data: {
        quizzes: [
          {
            id: 'quiz-1',
            title: 'Availability check',
            startTimeUtc: '2026-04-10T03:30:00',
            endTimeUtc: '2026-04-10T04:15:00',
          },
        ],
      },
    });

    const [quiz] = await getStudentQuizzes();

    expect(quiz?.availableFrom).toBe('2026-04-10T03:30:00Z');
    expect(quiz?.availableUntil).toBe('2026-04-10T04:15:00Z');
  });
});
