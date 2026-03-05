import type { ReactNode } from 'react';

type FormInputProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  disabled?: boolean;
  error?: string;
  icon?: ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FormInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  disabled = false,
  error,
  icon,
  onChange,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
          error ? 'border-red-400 bg-red-50/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {icon ? <span className="text-slate-500" aria-hidden>{icon}</span> : null}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={onChange}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
