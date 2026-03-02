import React from 'react';
import type { UserRole } from '@/lib/auth';

type RoleSelectProps = {
  label: string;
  name?: string;
  value: UserRole | '';
  disabled?: boolean;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

const roles: UserRole[] = ['Student', 'Instructor', 'Admin'];

export function RoleSelect({
  label,
  name = 'role',
  value,
  disabled = false,
  error,
  onChange,
}: RoleSelectProps) {
  const selectId = `${name}-select`;

  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        value={value}
        required
        disabled={disabled}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error ? 'border-red-500' : 'border-slate-200'
        }`}
      >
        <option value="" disabled>
          Select a role
        </option>
        {roles.map((roleOption) => (
          <option key={roleOption} value={roleOption}>
            {roleOption}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
