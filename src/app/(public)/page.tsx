import Link from 'next/link';

import { getPublicStats } from '@/lib/public';

const features = [
  {
    title: 'Course Management',
    description: 'Organize lessons, materials, and course structure in a single learning space.',
  },
  {
    title: 'Live Sessions',
    description: 'Deliver real-time teaching sessions and keep learners connected from anywhere.',
  },
  {
    title: 'Assignments',
    description: 'Share coursework, track submissions, and support consistent student practice.',
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor learner engagement and academic growth with clear progress visibility.',
  },
];

export default async function Home() {
  const stats = await getPublicStats();

  const statItems = [
    {
      label: 'Courses Available',
      value: stats?.totalCourses ?? null,
    },
    {
      label: 'Active Students',
      value: stats?.totalStudents ?? null,
    },
    {
      label: 'Expert Teachers',
      value: stats?.totalTeachers ?? null,
    },
  ];

  return (
    <main className="px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-200/60">
          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">
                Genuine English LMS
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Learn, teach, and track progress through one focused platform.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
                Give students and instructors a simple place to manage courses, attend live
                sessions, submit assignments, and follow learning progress without friction.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2F4EA2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#243b7a]"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-200 px-6 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Platform Stats
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {statItems.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-white p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : '—'}
                    </p>
                  </article>
                ))}
              </div>
              {!stats ? (
                <p className="mt-4 text-sm text-slate-500">
                  Live platform numbers are temporarily unavailable.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white px-6 py-10 shadow-xl shadow-slate-200/50 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Everything needed for a modern LMS experience.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-500">
              The platform is built to support structured learning, instructor workflows, and
              student visibility across the full course journey.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] bg-[#1f2a44] px-6 py-10 text-white shadow-xl shadow-slate-300/40 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-200">
                Get Started
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Create your account and start using the LMS today.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Choose the right registration path for your role, or sign in if you already have
                access to the platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
