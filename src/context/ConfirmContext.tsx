'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import ConfirmDialog from '@/components/ConfirmDialog';

export type ConfirmOptions = {
  title: string;
  description?: string;
  variant?: 'default' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type DialogState = {
  open: boolean;
  options: ConfirmOptions | null;
};

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, options: null });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    if (resolver) {
      resolver(result);
      resolverRef.current = null;
    }
    setDialogState({ open: false, options: null });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    const title = options.title?.trim();
    if (!title) {
      console.warn('[ConfirmProvider] Missing confirmation title.');
      return Promise.resolve(false);
    }

    if (resolverRef.current) {
      console.warn('[ConfirmProvider] A confirmation dialog is already active. Ignoring new request.');
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        options: {
          ...options,
          title,
          variant: options.variant ?? 'default',
          confirmText: options.confirmText ?? 'Confirm',
          cancelText: options.cancelText ?? 'Cancel',
        },
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog open={dialogState.open} options={dialogState.options} onConfirm={() => closeDialog(true)} onCancel={() => closeDialog(false)} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
