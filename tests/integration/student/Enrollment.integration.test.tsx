import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseDetailClient } from '@/features/public/courses/components/CourseDetailClient';
import type { Course } from '@/lib/courses';
import { setMockAuthSession } from '../../mocks/authSession';
import { vi } from 'vitest';

const mockGetMyStudentCourses = vi.fn();
const mockEnrollInStudentCourse = vi.fn();

vi.mock('@/features/student/api/student', () => ({
  getMyStudentCourses: (...args: unknown[]) => mockGetMyStudentCourses(...args),
  enrollInStudentCourse: (...args: unknown[]) => mockEnrollInStudentCourse(...args),
  StudentApiError: class extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const baseCourse: Course = {
  id: 'ielts-speaking-essentials',
  title: 'IELTS Speaking Essentials',
  description: 'Full description',
  shortDescription: 'Short description',
  category: 'IELTS',
  price: 79,
  durationHours: 18,
  teacherName: 'Genuine English',
  difficultyLevel: 'Intermediate',
  prerequisites: null,
  maxStudents: null,
  studentsEnrolled: 0,
  rating: 4.8,
  status: 'Active',
  tags: ['IELTS'],
};

describe('Student enrollment integration', () => {
  beforeEach(() => {
    mockGetMyStudentCourses.mockReset();
    mockEnrollInStudentCourse.mockReset();
    setMockAuthSession({ token: null, refreshToken: null, role: null, isAuthenticated: false, userId: null, name: null });
  });

  it('auto-detects an existing enrollment for student accounts', async () => {
    setMockAuthSession({ isAuthenticated: true, role: 'Student', userId: 'student-1' });
    mockGetMyStudentCourses.mockResolvedValue([{ id: baseCourse.id }]);

    render(<CourseDetailClient course={baseCourse} error={null} />);

    expect(await screen.findByText(/you are already enrolled/i)).toBeInTheDocument();
  });

  it('submits enroll now flow for authenticated students', async () => {
    setMockAuthSession({ isAuthenticated: true, role: 'Student', userId: 'student-1' });
    mockGetMyStudentCourses.mockResolvedValue([]);
    mockEnrollInStudentCourse.mockResolvedValue(undefined);

    render(<CourseDetailClient course={baseCourse} error={null} />);

    await userEvent.click(await screen.findByRole('button', { name: /enroll now/i }));

    await waitFor(() => expect(mockEnrollInStudentCourse).toHaveBeenCalledWith(baseCourse.id));
    const successMessages = await screen.findAllByText(/enrollment successful/i);
    expect(successMessages.length).toBeGreaterThan(0);
  });

});
