import React from 'react';

type PrimaryButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  loading?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function PrimaryButton({
  children,
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
      aria-busy={loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" aria-hidden />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
