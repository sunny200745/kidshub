import React from 'react';

const variants = {
  brand: 'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export function Badge({ 
  children, 
  variant = 'neutral', 
  icon: Icon,
  dot = false,
  className = '' 
}) {
  return (
    <span className={`${variants[variant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const statusConfig = {
    'checked-in': { label: 'Checked In', variant: 'success' },
    'checked-out': { label: 'Checked Out', variant: 'info' },
    'absent': { label: 'Absent', variant: 'neutral' },
    'late': { label: 'Late', variant: 'warning' },
  };

  const config = statusConfig[status] || statusConfig['absent'];

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
