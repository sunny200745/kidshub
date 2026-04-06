import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

export function Header({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-surface-100">
      <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-surface-100 text-surface-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-surface-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-surface-500 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search - Desktop only */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-surface-100 rounded-xl text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-xl hover:bg-surface-100 text-surface-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
