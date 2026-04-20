import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizDetailsForm } from '@/features/teacher/quizzes/components/QuizDetailsForm';
import { QuizQuestionComposer } from '@/features/teacher/quizzes/components/QuizQuestionComposer';
import TeacherQuizEditorPage from '@/features/teacher/quizzes/pages/TeacherQuizEditorPage';
import { defaultQuizEditorValues } from '@/features/teacher/quizzes/schemas';
import type { QuestionEditorValues, QuizEditorValues, TeacherQuizSummary } from '@/features/teacher/quizzes/types';
import TeacherCourseQuizzesPage from '@/features/teacher/quizzes/pages/TeacherCourseQuizzesPage';
import { confirmMock } from '../../mocks/confirmContext';
import { pushMock } from '../../mocks/nextNavigation';
import { vi } from 'vitest';
import React from 'react';

const mockGetTeacherCourseById = vi.fn();
const mockCreateTeacherQuiz = vi.fn();
const mockCreateTeacherQuizQuestion = vi.fn();
const mockDeleteTeacherQuizQuestion = vi.fn();
const mockGetTeacherQuizById = vi.fn();
const mockGetTeacherQuizQuestions = vi.fn();
const mockGetTeacherQuizzesByCourse = vi.fn();
const mockDeleteTeacherQuiz = vi.fn();
const mockPublishTeacherQuizResults = vi.fn();
const mockUnpublishTeacherQuizResults = vi.fn();
const mockUpdateTeacherQuiz = vi.fn();
const mockUpdateTeacherQuizQuestion = vi.fn();
const mockGetTeacherQuizErrorMessage = vi.fn((_error, fallback) => fallback);

vi.mock('@/features/teacher/api/teacher', () => ({
  getTeacherCourseById: (...args: unknown[]) => mockGetTeacherCourseById(...(args as Parameters<typeof mockGetTeacherCourseById>)),
}));

vi.mock('@/features/teacher/quizzes/api', () => ({
  createTeacherQuiz: (...args: unknown[]) => mockCreateTeacherQuiz(...(args as Parameters<typeof mockCreateTeacherQuiz>)),
  createTeacherQuizQuestion: (...args: unknown[]) =>
    mockCreateTeacherQuizQuestion(...(args as Parameters<typeof mockCreateTeacherQuizQuestion>)),
  deleteTeacherQuizQuestion: (...args: unknown[]) =>
    mockDeleteTeacherQuizQuestion(...(args as Parameters<typeof mockDeleteTeacherQuizQuestion>)),
  getTeacherQuizById: (...args: unknown[]) =>
    mockGetTeacherQuizById(...(args as Parameters<typeof mockGetTeacherQuizById>)),
  getTeacherQuizQuestions: (...args: unknown[]) =>
    mockGetTeacherQuizQuestions(...(args as Parameters<typeof mockGetTeacherQuizQuestions>)),
  getTeacherQuizzesByCourse: (...args: unknown[]) => mockGetTeacherQuizzesByCourse(...(args as Parameters<typeof mockGetTeacherQuizzesByCourse>)),
  deleteTeacherQuiz: (...args: unknown[]) => mockDeleteTeacherQuiz(...(args as Parameters<typeof mockDeleteTeacherQuiz>)),
  publishTeacherQuizResults: (...args: unknown[]) => mockPublishTeacherQuizResults(...(args as Parameters<typeof mockPublishTeacherQuizResults>)),
  unpublishTeacherQuizResults: (...args: unknown[]) => mockUnpublishTeacherQuizResults(...(args as Parameters<typeof mockUnpublishTeacherQuizResults>)),
  updateTeacherQuiz: (...args: unknown[]) =>
    mockUpdateTeacherQuiz(...(args as Parameters<typeof mockUpdateTeacherQuiz>)),
  updateTeacherQuizQuestion: (...args: unknown[]) =>
    mockUpdateTeacherQuizQuestion(...(args as Parameters<typeof mockUpdateTeacherQuizQuestion>)),
  getTeacherQuizErrorMessage: (...args: unknown[]) => mockGetTeacherQuizErrorMessage(...(args as Parameters<typeof mockGetTeacherQuizErrorMessage>)),
}));

function QuizCreationHarness({ onSubmit }: { onSubmit: (values: QuizEditorValues, questions: QuestionEditorValues[]) => void }) {
  const [questions, setQuestions] = React.useState<QuestionEditorValues[]>([]);
  return (
    <div>
      <QuizDetailsForm
        mode="create"
        onSubmit={(values) => onSubmit(values, questions)}
        initialValues={defaultQuizEditorValues}
      />
      <QuizQuestionComposer
        onSubmit={(question) => {
          setQuestions((current) => [...current, question]);
          return Promise.resolve();
        }}
      />
      <p data-testid="question-counter">{questions.length}</p>
    </div>
  );
}

describe('Teacher quiz flows', () => {
  beforeEach(() => {
    mockGetTeacherCourseById.mockReset();
    mockCreateTeacherQuiz.mockReset();
    mockCreateTeacherQuizQuestion.mockReset();
    mockDeleteTeacherQuizQuestion.mockReset();
    mockGetTeacherQuizById.mockReset();
    mockGetTeacherQuizQuestions.mockReset();
    mockGetTeacherQuizzesByCourse.mockReset();
    mockDeleteTeacherQuiz.mockReset();
    mockPublishTeacherQuizResults.mockReset();
    mockUnpublishTeacherQuizResults.mockReset();
    mockUpdateTeacherQuiz.mockReset();
    mockUpdateTeacherQuizQuestion.mockReset();
    confirmMock.mockImplementation(() => Promise.resolve(true));
  });

  it('creates a quiz with collected question payloads (LMS-149 to LMS-162 happy path)', async () => {
    const onSubmit = vi.fn();
    render(<QuizCreationHarness onSubmit={onSubmit} />);

    const questionTextInput = screen.getByLabelText(/question text/i);
    const [questionMarksInput] = screen.getAllByLabelText(/^Marks$/i);

    await userEvent.type(questionTextInput, 'What is 2 + 2?');
    await userEvent.clear(questionMarksInput);
    await userEvent.type(questionMarksInput, '2');
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await userEvent.type(optionInputs[0], '4');
    await userEvent.type(optionInputs[1], '5');
    await userEvent.click(screen.getByRole('button', { name: /add question/i }));

    expect(screen.getByTestId('question-counter')).toHaveTextContent('1');

    const quizTitleInput = screen.getByLabelText(/title/i);
    const quizDurationInput = screen.getByLabelText(/duration \(minutes\)/i);
    const quizTotalMarksInput = screen.getByLabelText(/total marks/i);

    await userEvent.clear(quizTitleInput);
    await userEvent.type(quizTitleInput, 'Weekly mastery quiz');
    await userEvent.clear(quizDurationInput);
    await userEvent.type(quizDurationInput, '20');
    await userEvent.clear(quizTotalMarksInput);
    await userEvent.type(quizTotalMarksInput, '20');
    await userEvent.type(screen.getByLabelText(/start time/i), '2026-04-10T09:00');
    await userEvent.type(screen.getByLabelText(/end time/i), '2026-04-10T09:30');

    await userEvent.click(screen.getByRole('button', { name: /create quiz/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [values, questions] = onSubmit.mock.calls[0] as [QuizEditorValues, QuestionEditorValues[]];
    expect(values.title).toBe('Weekly mastery quiz');
    expect(questions).toHaveLength(1);
    expect(questions[0].options.some((option) => option.isCorrect)).toBe(true);
  });

  it('serializes quiz availability timestamps as UTC when creating quizzes', async () => {
    mockGetTeacherCourseById.mockResolvedValue({ title: 'Physics 201' });
    mockCreateTeacherQuiz.mockResolvedValue('quiz-created');

    render(<TeacherQuizEditorPage mode="create" courseId="course-99" />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /create quiz for physics 201/i })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText(/title/i), 'Timezone check');
    await userEvent.clear(screen.getByLabelText(/duration \(minutes\)/i));
    await userEvent.type(screen.getByLabelText(/duration \(minutes\)/i), '30');
    await userEvent.clear(screen.getByLabelText(/total marks/i));
    await userEvent.type(screen.getByLabelText(/total marks/i), '50');
    await userEvent.type(screen.getByLabelText(/start time/i), '2026-04-20T19:15');
    await userEvent.type(screen.getByLabelText(/end time/i), '2026-04-20T20:15');
    await userEvent.click(screen.getByLabelText(/publish quiz/i));

    await userEvent.click(screen.getByRole('button', { name: /create quiz/i }));

    await waitFor(() => expect(mockCreateTeacherQuiz).toHaveBeenCalledTimes(1));

    expect(mockCreateTeacherQuiz).toHaveBeenCalledWith({
      courseId: 'course-99',
      title: 'Timezone check',
      description: null,
      durationMinutes: 30,
      totalMarks: 50,
      startTimeUtc: new Date(2026, 3, 20, 19, 15).toISOString(),
      endTimeUtc: new Date(2026, 3, 20, 20, 15).toISOString(),
      randomizeQuestions: false,
      allowMultipleAttempts: false,
      isPublished: true,
      areResultsPublished: false,
    });
    expect(pushMock).toHaveBeenCalledWith(
      '/teacher/dashboard/courses/course-99/quizzes/quiz-created/edit',
    );
  });

  it('loads, deletes, and publishes quizzes inside TeacherCourseQuizzesPage', async () => {
    const quizzes: TeacherQuizSummary[] = [
      {
        id: 'quiz-1',
        title: 'Quiz A',
        durationMinutes: 30,
        submissionCount: 10,
        averageScorePercent: 75,
        questionCount: 5,
        totalMarks: 25,
        startTimeUtc: '2026-03-01T00:00:00Z',
        endTimeUtc: '2026-03-01T01:00:00Z',
        areResultsPublished: false,
        isPublished: true,
        createdAt: '2026-02-28T00:00:00Z',
      },
    ];
    mockGetTeacherCourseById.mockResolvedValue({ title: 'Physics 201' });
    mockGetTeacherQuizzesByCourse.mockResolvedValue(quizzes);
    mockDeleteTeacherQuiz.mockResolvedValue(undefined);
    mockPublishTeacherQuizResults.mockResolvedValue(undefined);

    render(<TeacherCourseQuizzesPage courseId="course-99" />);

    await waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /publish results/i }));
    expect(mockPublishTeacherQuizResults).toHaveBeenCalledWith('quiz-1');

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(mockDeleteTeacherQuiz).toHaveBeenCalledWith('quiz-1'));
  });
});
