import React from 'react';

type ErrorAlertProps = {
  message: string;
};

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </div>
  );
}
