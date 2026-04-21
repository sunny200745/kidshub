import React from 'react';
import { Menu } from 'lucide-react';
import { SearchInput } from '../ui';
import { Notifications } from './Notifications';

export function Header({ title, subtitle, actions, onMenuClick }) {
  return (
    <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-lg border-b border-surface-100 sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-100 text-surface-600 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-surface-900 truncate">
              {typeof title === 'string' ? title : title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-surface-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden md:block w-48 lg:w-64">
            <SearchInput placeholder="Search..." />
          </div>
          
          <Notifications />
          
          {actions}
        </div>
      </div>
    </header>
  );
}
