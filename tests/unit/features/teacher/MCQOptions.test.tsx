import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizQuestionComposer } from '@/features/teacher/quizzes/components/QuizQuestionComposer';
import { QUIZ_QUESTION_TYPES } from '@/features/teacher/quizzes/types';
import { vi } from 'vitest';

describe('LMS-162 MCQ option management', () => {
  const setup = () => {
    const onSubmit = vi.fn();
    render(<QuizQuestionComposer mode="create" onSubmit={onSubmit} />);
    return { onSubmit };
  };

  it('adds/removes options and recalculates the option ordering', async () => {
    setup();
    const questionTypeSelect = screen.getByLabelText(/question type/i);
    await userEvent.selectOptions(questionTypeSelect, `${QUIZ_QUESTION_TYPES.multipleMcq}`);

    await userEvent.click(screen.getByRole('button', { name: /add option/i }));
    let optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs).toHaveLength(3);

    await userEvent.click(screen.getAllByRole('button', { name: /remove option/i })[0]);
    optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs).toHaveLength(2);
  });

  it('enforces single-correct answers for single MCQ', async () => {
    const { onSubmit } = setup();

    const questionTypeSelect = screen.getByLabelText(/question type/i);
    const questionTextInput = screen.getByLabelText(/question text/i);
    const [questionMarksInput] = screen.getAllByLabelText(/^Marks$/i);

    await userEvent.selectOptions(questionTypeSelect, `${QUIZ_QUESTION_TYPES.singleMcq}`);
    await userEvent.type(questionTextInput, 'Who invented the web?');
    await userEvent.clear(questionMarksInput);
    await userEvent.type(questionMarksInput, '5');

    await userEvent.type(screen.getAllByPlaceholderText(/option/i)[0], 'Tim Berners-Lee');
    await userEvent.type(screen.getAllByPlaceholderText(/option/i)[1], 'Alan Turing');

    // mark second option as correct, first should auto toggle off
    await userEvent.click(screen.getAllByRole('button', { name: /mark option/i })[1]);

    await userEvent.click(screen.getByRole('button', { name: /add question/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.options.filter((option: { isCorrect: boolean }) => option.isCorrect)).toHaveLength(1);
  });

  it('requires at least one correct answer for multiple MCQ', async () => {
    const { onSubmit } = setup();

    const questionTypeSelect = screen.getByLabelText(/question type/i);
    const questionTextInput = screen.getByLabelText(/question text/i);
    const [questionMarksInput] = screen.getAllByLabelText(/^Marks$/i);

    await userEvent.selectOptions(questionTypeSelect, `${QUIZ_QUESTION_TYPES.multipleMcq}`);
    await userEvent.type(questionTextInput, 'Select the prime numbers');
    await userEvent.clear(questionMarksInput);
    await userEvent.type(questionMarksInput, '4');

    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await userEvent.type(optionInputs[0], '2');
    await userEvent.type(optionInputs[1], '3');

    const optionButtons = screen.getAllByRole('button', { name: /mark option/i });
    await userEvent.click(optionButtons[0]); // toggle off default true option

    await userEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Multiple MCQ questions need at least one correct option.'),
    ).toBeInTheDocument();
  });
});
