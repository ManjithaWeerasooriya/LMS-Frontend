'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getTeacherCourses,
  type TeacherCourse,
} from '@/features/teacher/api/teacher';
import {
  getTeacherQuizAnalytics,
  getTeacherQuizzesByCourse,
  getTeacherQuizErrorMessage,
} from '@/features/teacher/quizzes/api';
import {
  BreadcrumbTrail,
  QuizMetricCard,
  QuizPageHeader,
  QuizSectionCard,
  QuizStatePanel,
} from '@/features/teacher/quizzes/components/QuizShared';
import type {
  TeacherQuizAnalytics,
  TeacherQuizSummary,
} from '@/features/teacher/quizzes/types';
import {
  formatMarks,
  formatPercentage,
} from '@/features/teacher/quizzes/utils';

export default function TeacherAnalyticsPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [quizzes, setQuizzes] = useState<TeacherQuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [analytics, setAnalytics] = useState<TeacherQuizAnalytics | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      setLoadingCourses(true);
      setError(null);

      try {
        const data = await getTeacherCourses();
        if (!active) return;

        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId((current) => current || data[0].id);
        }
      } catch (loadError) {
        if (!active) return;
        setError(getTeacherQuizErrorMessage(loadError, 'Unable to load your courses.'));
      } finally {
        if (active) {
          setLoadingCourses(false);
        }
      }
    };

    void loadCourses();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setQuizzes([]);
      setSelectedQuizId('');
      setAnalytics(null);
      return;
    }

    let active = true;

    const loadQuizzes = async () => {
      setLoadingQuizzes(true);
      setError(null);

      try {
        const courseQuizzes = await getTeacherQuizzesByCourse(selectedCourseId);
        if (!active) return;

        setQuizzes(courseQuizzes);
        if (courseQuizzes.length > 0) {
          setSelectedQuizId((current) => {
            if (current && courseQuizzes.some((quiz) => quiz.id === current)) {
              return current;
            }
            return courseQuizzes[0]?.id ?? '';
          });
        } else {
          setSelectedQuizId('');
          setAnalytics(null);
        }
      } catch (loadError) {
        if (!active) return;
        setError(getTeacherQuizErrorMessage(loadError, 'Unable to load course quizzes.'));
        setQuizzes([]);
        setSelectedQuizId('');
        setAnalytics(null);
      } finally {
        if (active) {
          setLoadingQuizzes(false);
        }
      }
    };

    void loadQuizzes();

    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedQuizId) {
      setAnalytics(null);
      return;
    }

    let active = true;

    const loadAnalytics = async () => {
      setLoadingAnalytics(true);
      setError(null);

      try {
        const data = await getTeacherQuizAnalytics(selectedQuizId);
        if (!active) return;
        setAnalytics(data);
      } catch (loadError) {
        if (!active) return;
        setError(getTeacherQuizErrorMessage(loadError, 'Unable to load quiz analytics.'));
        setAnalytics(null);
      } finally {
        if (active) {
          setLoadingAnalytics(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [selectedQuizId]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  const scoreData = useMemo(() => {
    if (!analytics) return [];

    return [
      { label: 'Average', value: analytics.averageScore },
      { label: 'Highest', value: analytics.highestScore },
      { label: 'Lowest', value: analytics.lowestScore },
    ];
  }, [analytics]);

  const passFailData = useMemo(() => {
    if (!analytics) return [];

    const clamp = (value: number): number => Math.max(0, Math.min(100, value));

    return [
      { label: 'Pass', value: clamp(analytics.passPercentage) },
      { label: 'Fail', value: clamp(analytics.failPercentage) },
    ];
  }, [analytics]);

  const hasSelection = Boolean(selectedCourseId && selectedQuizId);

  const showLoadingPanel = !analytics && hasSelection && loadingAnalytics;
  const showEmptyPanel = !analytics && hasSelection && !loadingAnalytics && !error;

  return (
    <div className="space-y-6">
      <QuizPageHeader
        eyebrow="Quiz Analytics"
        title="Class Performance Analytics"
        description="Select a quiz to explore average scores, pass/fail rates, participation, and score ranges for your class."
      >
        <BreadcrumbTrail
          items={[
            { label: 'Quiz Workspace', href: '/teacher/dashboard/quizzes' },
            { label: 'Analytics' },
          ]}
        />
      </QuizPageHeader>

      <QuizSectionCard
        title="Select quiz to analyse"
        description="Analytics are calculated per quiz using students' best attempts."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="course-select"
              className="block text-sm font-medium text-slate-700"
            >
              Course
            </label>
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loadingCourses}
            >
              {loadingCourses ? (
                <option>Loading courses…</option>
              ) : courses.length === 0 ? (
                <option>No courses available</option>
              ) : (
                courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="quiz-select"
              className="block text-sm font-medium text-slate-700"
            >
              Quiz
            </label>
            <select
              id="quiz-select"
              value={selectedQuizId}
              onChange={(event) => setSelectedQuizId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loadingQuizzes || !selectedCourseId || quizzes.length === 0}
            >
              {!selectedCourseId ? (
                <option>Select a course first</option>
              ) : loadingQuizzes ? (
                <option>Loading quizzes…</option>
              ) : quizzes.length === 0 ? (
                <option>No quizzes for this course</option>
              ) : (
                quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedCourse && selectedQuiz ? (
          <p className="mt-3 text-xs text-slate-500">
            Showing analytics for <span className="font-semibold">{selectedQuiz.title}</span> in{' '}
            <span className="font-semibold">{selectedCourse.title}</span>.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
        ) : null}
      </QuizSectionCard>

      {!hasSelection ? (
        <QuizStatePanel
          title="Select a quiz to view analytics"
          message="Choose a course and quiz above to see class performance metrics once students have attempted the assessment."
        />
      ) : showLoadingPanel ? (
        <QuizStatePanel
          title="Loading quiz analytics"
          message="Fetching score distribution, pass/fail rates, and participation for the selected quiz."
        />
      ) : showEmptyPanel ? (
        <QuizStatePanel
          title="No analytics available yet"
          message="Once students have completed this quiz, their best attempts will be used to generate performance analytics here."
        />
      ) : analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuizMetricCard
              label="Average Score"
              value={formatMarks(analytics.averageScore)}
              hint={`Out of ${formatMarks(analytics.totalMarks)} marks`}
            />
            <QuizMetricCard
              label="Score Range"
              value={`${formatMarks(analytics.lowestScore)}–${formatMarks(analytics.highestScore)}`}
              hint="Lowest to highest best attempt"
            />
            <QuizMetricCard
              label="Pass Rate"
              value={formatPercentage(analytics.passPercentage)}
              hint="Based on students' best attempts"
            />
            <QuizMetricCard
              label="Participation"
              value={formatPercentage(analytics.participationRate)}
              hint={`${analytics.studentsParticipated} of ${analytics.totalEnrolledStudents} students attempted`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <QuizSectionCard
              title="Score profile"
              description="Compare average, highest, and lowest scores from students' best attempts."
            >
              {scoreData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Score data is not available for this quiz yet.
                </p>
              ) : (
                <div className="mt-2 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreData}
                      margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, Math.max(analytics.totalMarks, analytics.highestScore, 0)]}
                      />
                      <Tooltip
                        formatter={(value) => formatMarks(value as number)}
                        labelFormatter={(label) => `${label} score`}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1B3B8B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </QuizSectionCard>

            <QuizSectionCard
              title="Pass, fail & participation"
              description="Understand how many students are passing and how many are engaging with this quiz."
            >
              {passFailData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Pass/fail breakdown is not available for this quiz yet.
                </p>
              ) : (
                <div className="mt-2 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={passFailData}
                      margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value) => `${Math.round(value as number)}%`}
                        labelFormatter={(label) => `${label} rate`}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {passFailData.map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={entry.label === 'Pass' ? '#22c55e' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Participation
                </p>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1B3B8B] transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, analytics.participationRate),
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {analytics.studentsParticipated} of {analytics.totalEnrolledStudents} students
                  have at least one graded attempt.
                </p>
              </div>
            </QuizSectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

