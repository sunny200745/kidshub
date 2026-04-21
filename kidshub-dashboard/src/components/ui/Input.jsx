import React from 'react';
import { Search } from 'lucide-react';

export function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-surface-400" />
          </div>
        )}
        <input
          className={`input ${Icon ? 'pl-11' : ''} ${
            error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

export function SearchInput({ placeholder = 'Search...', className = '', ...props }) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      icon={Search}
      className={className}
      {...props}
    />
  );
}

export function Select({
  label,
  options,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10 ${
          error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = '',
  rows = 4,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`input resize-none ${
          error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
