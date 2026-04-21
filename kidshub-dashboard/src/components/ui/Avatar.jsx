import React from 'react';

const sizeClasses = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
  '2xl': 'avatar-2xl',
};

export function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  status,
  className = '' 
}) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`avatar ${sizeClasses[size]}`}>
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white status-dot status-dot-${status}`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ children, max = 4, size = 'md' }) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`avatar ${sizeClasses[size]} ring-2 ring-white bg-surface-200 text-surface-600`}
        >
          <span>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}
