import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizQuestionComposer } from '@/features/teacher/quizzes/components/QuizQuestionComposer';
import { QUIZ_QUESTION_TYPES } from '@/features/teacher/quizzes/types';
import { vi } from 'vitest';

describe('LMS-160/161 Dynamic Question UI', () => {
  const renderComposer = () =>
    render(<QuizQuestionComposer mode="create" onSubmit={vi.fn()} initialValue={undefined} />);

  it('switches from MCQ to essay/short-answer and hides option controls', async () => {
    renderComposer();

    await userEvent.selectOptions(screen.getByLabelText(/question type/i), `${QUIZ_QUESTION_TYPES.essay}`);
    expect(
      screen.getByText(/students will submit a written answer/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add option/i })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/question type/i), `${QUIZ_QUESTION_TYPES.shortAnswer}`);
    expect(screen.queryByRole('button', { name: /add option/i })).not.toBeInTheDocument();
  });

  it('resets the option set when switching question types', async () => {
    renderComposer();

    await userEvent.selectOptions(screen.getByLabelText(/question type/i), `${QUIZ_QUESTION_TYPES.multipleMcq}`);
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs).toHaveLength(2);

    await userEvent.type(optionInputs[0], 'Option A');
    await userEvent.type(optionInputs[1], 'Option B');

    await userEvent.selectOptions(screen.getByLabelText(/question type/i), `${QUIZ_QUESTION_TYPES.trueFalse}`);
    expect(screen.getAllByRole('button', { name: /mark option/i })).toHaveLength(2);
    expect(screen.getByDisplayValue('True')).toBeDisabled();
    expect(screen.getByDisplayValue('False')).toBeDisabled();
  });
});
