'use client';

import { useEffect, useId, useMemo, useRef } from 'react';

import type { ConfirmOptions } from '@/context/ConfirmContext';

type ConfirmDialogProps = {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantStyles: Record<NonNullable<ConfirmOptions['variant']>, { icon: string; iconWrapper: string; confirmButton: string }> = {
  default: {
    icon: 'text-blue-700',
    iconWrapper: 'bg-blue-100',
    confirmButton: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-200',
  },
  warning: {
    icon: 'text-amber-700',
    iconWrapper: 'bg-amber-100',
    confirmButton: 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-200',
  },
  danger: {
    icon: 'text-rose-700',
    iconWrapper: 'bg-rose-100',
    confirmButton: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-200',
  },
};

export default function ConfirmDialog({ open, options, onConfirm, onCancel }: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusTarget = confirmButtonRef.current ?? cancelButtonRef.current;
      requestAnimationFrame(() => focusTarget?.focus());
    } else if (previousActiveRef.current) {
      previousActiveRef.current.focus();
      previousActiveRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean) as HTMLElement[];
        if (!focusable.length) return;
        const activeElement = document.activeElement as HTMLElement | null;
        const currentIndex = focusable.findIndex((element) => element === activeElement);
        let nextIndex = currentIndex;

        if (event.shiftKey) {
          nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
        }

        event.preventDefault();
        focusable[nextIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  const variant = options?.variant ?? 'default';
  const styles = variantStyles[variant];
  const confirmText = options?.confirmText ?? 'Confirm';
  const cancelText = options?.cancelText ?? 'Cancel';

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const iconLabel = useMemo(() => {
    if (variant === 'danger') return 'High risk action';
    if (variant === 'warning') return 'Proceed with caution';
    return 'Please confirm';
  }, [variant]);

  if (!open || !options) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6" role="presentation" onMouseDown={handleBackdropClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={options.description ? descriptionId : undefined}
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconWrapper}`} aria-hidden="true">
            <span className={`text-2xl font-semibold ${styles.icon}`}>!</span>
          </div>
          <div className="flex-1">
            <p id={titleId} className="text-lg font-semibold text-slate-900">
              {options.title}
            </p>
            {options.description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                {options.description}
              </p>
            ) : null}
            <p className="sr-only">{iconLabel}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 sm:flex-none"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex flex-1 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${styles.confirmButton} sm:flex-none`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
