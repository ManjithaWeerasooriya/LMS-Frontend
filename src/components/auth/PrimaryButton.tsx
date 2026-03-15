import type { ButtonHTMLAttributes, ReactNode } from 'react';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
};

export function PrimaryButton({ children, loading = false, disabled, ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F4EA2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26408a] disabled:cursor-not-allowed disabled:bg-blue-300"
      aria-busy={loading}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
