import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Baby,
  School,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  Activity,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../ui';
import { useAuth } from '../../contexts';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Children', href: '/children', icon: Baby },
  { name: 'Check In/Out', href: '/check-in', icon: UserCheck },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Classrooms', href: '/classrooms', icon: School },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 2 },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
];

const bottomNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle, isMobile = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Manager';
  };

  const getUserRole = () => {
    return 'Manager';
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-surface-100 flex flex-col transition-all duration-300 ${
        isMobile ? 'w-72' : collapsed ? 'w-20' : 'w-64'
      } ${isMobile ? '' : 'fixed top-0 left-0 z-40'}`}
    >
      {/* Logo */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-brand">
            <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-lg sm:text-xl text-gradient">KidsHub</span>
          )}
        </div>
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`relative ${isActive ? 'nav-item-active' : 'nav-item'}`}
              title={collapsed && !isMobile ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <>
                  <span className="flex-1 text-sm sm:text-base">{item.name}</span>
                  {item.badge && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-brand-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && !isMobile && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-surface-100 space-y-1">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={isActive ? 'nav-item-active' : 'nav-item'}
              title={collapsed && !isMobile ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="text-sm sm:text-base">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-surface-100">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <Avatar name={getUserDisplayName()} size="sm" status="online" />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-surface-500 truncate">{getUserRole()}</p>
            </div>
          )}
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`mt-2 w-full flex items-center gap-3 p-2 rounded-xl text-surface-500 hover:text-danger-600 hover:bg-danger-50 transition-colors ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
          title={collapsed && !isMobile ? 'Sign Out' : undefined}
        >
          {loggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          ) : (
            <LogOut className="w-5 h-5 flex-shrink-0" />
          )}
          {(!collapsed || isMobile) && (
            <span className="text-sm">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
