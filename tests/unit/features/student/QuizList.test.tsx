import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboardPage from '@/features/student/pages/StudentDashboardPage';
import { vi } from 'vitest';

const mockGetStudentDashboard = vi.fn();

vi.mock('@/features/student/api/student', () => {
  return {
    getStudentDashboard: (...args: unknown[]) => mockGetStudentDashboard(...args),
    StudentApiError: class extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    },
  };
});

vi.mock('@/lib/auth', () => ({
  logoutUser: vi.fn(),
}));

describe('LMS-151 Student quiz list', () => {
  beforeEach(() => {
    mockGetStudentDashboard.mockReset();
  });

  it('renders pending quizzes with routing context', async () => {
    mockGetStudentDashboard.mockResolvedValue({
      summary: { enrolledCourses: 2, upcomingClasses: 1, pendingQuizzes: 1 },
      myCourses: [],
      upcomingClasses: [],
      pendingQuizzes: [
        { quizId: 'quiz-100', title: 'Chemistry Lab Prep', courseTitle: 'Chem 102', durationMinutes: 15 },
      ],
    });

    render(<StudentDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Chemistry Lab Prep')).toBeInTheDocument();
      expect(screen.getByText(/chem 102/i)).toBeInTheDocument();
    });
  });

  it('shows empty states when student has no data', async () => {
    mockGetStudentDashboard.mockResolvedValue({
      summary: { enrolledCourses: 0, upcomingClasses: 0, pendingQuizzes: 0 },
      myCourses: [],
      upcomingClasses: [],
      pendingQuizzes: [],
    });

    render(<StudentDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no enrolled courses yet/i)).toBeInTheDocument();
      expect(screen.getByText(/no pending quizzes right now/i)).toBeInTheDocument();
    });
  });
});
