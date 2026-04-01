'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import type { QuestionType } from '@/generated/api-types';
import { getQuestionTypeLabel } from '@/features/teacher/quizzes/types';

type HeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

type QuizPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  actions?: HeaderAction[];
  children?: ReactNode;
};

const actionStyles: Record<NonNullable<HeaderAction['variant']>, string> = {
  primary:
    'bg-[#1B3B8B] text-white shadow-md hover:bg-[#17306f] disabled:bg-slate-300 disabled:text-white',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
};

export function QuizPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  actions,
  children,
}: QuizPageHeaderProps) {
  return (
    <header className="space-y-4">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-700">{eyebrow}</p>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {actions?.length ? (
          <div className="flex flex-wrap items-center gap-3">
            {actions.map((action) => {
              const className = `inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${actionStyles[action.variant ?? 'secondary']}`;

              if (action.href) {
                return (
                  <Link key={`${action.label}-${action.href}`} href={action.href} className={className}>
                    {action.label}
                  </Link>
                );
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={className}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {children}
    </header>
  );
}

export function QuizSectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function QuizStatePanel({
  title,
  message,
  action,
  tone = 'neutral',
}: {
  title: string;
  message: string;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
}) {
  const wrapperClass =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-slate-200 bg-slate-50 text-slate-700';
  const iconClass = tone === 'error' ? 'text-rose-600' : 'text-slate-400';

  return (
    <div className={`rounded-3xl border px-5 py-10 text-center ${wrapperClass}`}>
      <AlertCircle className={`mx-auto h-10 w-10 ${iconClass}`} />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function QuizMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function QuizStatusBadge({
  isPublished,
  areResultsPublished,
}: {
  isPublished: boolean;
  areResultsPublished: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {isPublished ? 'Published' : 'Draft'}
      </span>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          areResultsPublished ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {areResultsPublished ? 'Results visible' : 'Results hidden'}
      </span>
    </div>
  );
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {getQuestionTypeLabel(type)}
    </span>
  );
}

export function BreadcrumbTrail({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => {
        const content = item.href ? (
          <Link href={item.href} className="transition hover:text-slate-700">
            {item.label}
          </Link>
        ) : (
          <span className="font-medium text-slate-700">{item.label}</span>
        );

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {content}
            {index < items.length - 1 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
