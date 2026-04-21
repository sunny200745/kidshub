import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      {description && (
        <p className="text-surface-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later',
  retry,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-danger-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-danger-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-surface-500 mb-4">{description}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
