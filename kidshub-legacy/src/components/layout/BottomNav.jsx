import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, Image, MessageSquare, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/activity', icon: Activity, label: 'Activity' },
  { path: '/photos', icon: Image, label: 'Photos' },
  { path: '/messages', icon: MessageSquare, label: 'Messages', badge: 1 },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`bottom-nav-item relative ${isActive ? 'bottom-nav-item-active' : ''}`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'text-brand-600' : 'text-surface-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-600' : 'text-surface-400'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
