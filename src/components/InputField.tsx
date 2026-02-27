import React from 'react';

type InputFieldProps = {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function InputField({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  disabled = false,
  error,
  onChange,
}: InputFieldProps) {
  const inputId = `${name}-input`;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required
        disabled={disabled}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error ? 'border-red-500' : 'border-slate-200'
        }`}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
