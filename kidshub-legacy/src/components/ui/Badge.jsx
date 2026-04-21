import React from 'react';

const variantClasses = {
  brand: 'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'bg-surface-100 text-surface-600',
};

export function Badge({ children, variant = 'brand', className = '' }) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
