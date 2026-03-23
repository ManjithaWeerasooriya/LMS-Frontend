const summaryCards = [
  {
    label: 'Enrolled Courses',
    value: '6',
    iconBg: 'bg-blue-100',
    iconEmoji: '📘',
  },
  {
    label: 'Upcoming Classes',
    value: '4',
    iconBg: 'bg-violet-100',
    iconEmoji: '🎥',
  },
  {
    label: 'Pending Quizzes',
    value: '3',
    iconBg: 'bg-amber-100',
    iconEmoji: '📋',
  },
  {
    label: 'Current GPA',
    value: '3.8',
    iconBg: 'bg-emerald-100',
    iconEmoji: '🏆',
  },
];

const enrolledCourses = [
  {
    id: 1,
    title: 'Advanced English Grammar',
    instructor: 'Dr. Sarah Johnson',
    progress: 75,
    completedLessons: 12,
    totalLessons: 16,
    nextLesson: 'Conditional Sentences',
  },
  {
    id: 2,
    title: 'IELTS Speaking Practice',
    instructor: 'Prof. Michael Chen',
    progress: 60,
    completedLessons: 9,
    totalLessons: 15,
    nextLesson: 'Part 2 Topics',
  },
  {
    id: 3,
    title: 'Business Communication',
    instructor: 'Dr. Emily Brown',
    progress: 85,
    completedLessons: 17,
    totalLessons: 20,
    nextLesson: 'Presentation Skills',
  },
  {
    id: 4,
    title: 'Academic Writing',
    instructor: 'Dr. Robert Clark',
    progress: 45,
    completedLessons: 9,
    totalLessons: 20,
    nextLesson: 'Essay Structure',
  },
];

const upcomingClasses = [
  {
    id: 1,
    title: 'Grammar Review Session',
    course: 'Advanced Grammar',
    date: '2026-02-24',
    time: '10:00 AM',
    duration: '60 min',
  },
  {
    id: 2,
    title: 'IELTS Mock Test',
    course: 'IELTS Practice',
    date: '2026-02-24',
    time: '2:00 PM',
    duration: '90 min',
  },
  {
    id: 3,
    title: 'Writing Workshop',
    course: 'Academic Writing',
    date: '2026-02-25',
    time: '11:00 AM',
    duration: '45 min',
  },
];

const pendingQuizzes = [
  {
    id: 1,
    title: 'Grammar Quiz - Module 3',
    course: 'Advanced Grammar',
    questions: 20,
    due: '2026-02-25',
    duration: '30 min',
  },
  {
    id: 2,
    title: 'Vocabulary Test',
    course: 'IELTS Practice',
    questions: 15,
    due: '2026-02-26',
    duration: '20 min',
  },
  {
    id: 3,
    title: 'Writing Assessment',
    course: 'Business Communication',
    questions: 5,
    due: '2026-02-27',
    duration: '45 min',
  },
];

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
          Student Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Continue your learning journey.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${card.iconBg}`}
              >
                <span>{card.iconEmoji}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            My Enrolled Courses
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {enrolledCourses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">{course.instructor}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {course.title}
                  </h3>
                </div>
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {course.completedLessons}/{course.totalLessons}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span className="font-semibold text-slate-800">
                  {course.progress}%
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#2F4EA2]"
                  style={{ width: `${course.progress}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-2 text-xs">
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
                    Next Lesson
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {course.nextLesson}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163170]"
                >
                  ▶ Continue Learning
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Upcoming Live Classes
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {upcomingClasses.length} Scheduled
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingClasses.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {session.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.course}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.date} · {session.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {session.duration}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#163170]"
                    >
                      Join Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Pending Quizzes
              </h2>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {pendingQuizzes.length} Pending
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {pendingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {quiz.title}
                    </p>
                    <p className="text-xs text-slate-600">{quiz.course}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {quiz.duration} · Due {quiz.due}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#3B82F6] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2563EB]"
                  >
                    Start Quiz
                  </button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Performance Trend
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Average course performance over recent months.
            </p>
            <div className="mt-4 h-44 rounded-2xl bg-slate-50 px-4 py-3">
              <svg
                viewBox="0 0 200 100"
                className="h-full w-full text-[#1B3B8B]"
                role="img"
                aria-label="Performance trend chart"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  points="10,75 40,72 70,68 100,63 130,58 160,53 190,50"
                />
                {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map(
                  (month, index) => {
                    const x = 10 + index * 30;
                    return (
                      <text
                        key={month}
                        x={x}
                        y={95}
                        fontSize="8"
                        textAnchor="middle"
                        fill="#64748b"
                      >
                        {month}
                      </text>
                    );
                  },
                )}
              </svg>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Skills Analysis
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Relative strengths across core language skills.
            </p>
            <div className="mt-4 flex h-44 items-center justify-center rounded-2xl bg-slate-50">
              <svg
                viewBox="0 0 200 200"
                className="h-40 w-40 text-[#1B3B8B]"
                role="img"
                aria-label="Skills radar chart"
              >
                <polygon
                  points="100,25 170,75 145,160 55,160 30,75"
                  fill="#1d4ed8"
                  fillOpacity="0.12"
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
                <polygon
                  points="100,40 155,80 140,145 60,145 45,80"
                  fill="#93c5fd"
                  fillOpacity="0.35"
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
                <text
                  x="100"
                  y="18"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#64748b"
                >
                  Grammar
                </text>
                <text
                  x="172"
                  y="80"
                  fontSize="10"
                  textAnchor="start"
                  fill="#64748b"
                >
                  Speaking
                </text>
                <text
                  x="145"
                  y="176"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#64748b"
                >
                  Writing
                </text>
                <text
                  x="55"
                  y="176"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#64748b"
                >
                  Reading
                </text>
                <text
                  x="28"
                  y="80"
                  fontSize="10"
                  textAnchor="end"
                  fill="#64748b"
                >
                  Listening
                </text>
              </svg>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

