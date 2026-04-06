import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        className="animate-spin text-brand-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-surface-500 animate-pulse">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card animate-pulse">
      <div className="card-body">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-200 rounded w-3/4" />
            <div className="h-3 bg-surface-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-surface-200 rounded ${className}`} />;
}
