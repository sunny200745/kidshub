import React, { useEffect, useState } from 'react';
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
  Megaphone,
  FileText,
  Heart,
  Video,
  Sparkles,
  Loader2,
  Rocket,
} from 'lucide-react';
import { Avatar, TierBadge } from '../ui';
import { useAuth } from '../../contexts';
import { centersApi } from '../../firebase/api/centers';
import { ROLE_LABELS } from '../../constants/roles';

// `tierFeature` ties a nav item to a representative paid feature so the
// sidebar can surface a Pro/Premium pill next to the label. We pick the
// "anchor" feature most users associate with the section (e.g. reports
// landing shows Attendance + Health, both Pro — so `attendanceReports`
// is a fine anchor). Items with no paid surfaces omit the field and
// `<TierBadge>` renders nothing.
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Children', href: '/children', icon: Baby },
  { name: 'Check In/Out', href: '/check-in', icon: UserCheck },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Classrooms', href: '/classrooms', icon: School },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Parents', href: '/parents', icon: Heart },
  { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 2 },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText, tierFeature: 'attendanceReports' },
  { name: 'Video surveillance', href: '/video-surveillance', icon: Video, tierFeature: 'videoSurveillance' },
];

// Rendered with a pink-to-violet gradient treatment (see render block
// below) so the discovery / upgrade entry point stands apart from the
// operational nav above it. Kept out of `navigation` to avoid gradient
// styling bleeding into workflow rows.
const discoveryNav = [
  { name: 'Unlock features', href: '/unlock', icon: Sparkles },
];

const bottomNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle, isMobile = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, isOwner, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Local subscription so the "Continue setup" item appears for owners
  // who haven't dismissed the welcome wizard yet, and disappears the
  // moment they do (or as soon as it's first stamped on a fresh signup).
  // We deliberately use the centersApi snapshot instead of useEntitlements
  // here to avoid pulling the entitlements hook into Sidebar — it would
  // recompute on every plan/demoMode change and re-render the nav.
  const [setupOpen, setSetupOpen] = useState(false);
  useEffect(() => {
    if (!user?.uid || !isOwner) {
      setSetupOpen(false);
      return undefined;
    }
    const unsub = centersApi.subscribeToSelfCenter(
      (data) => {
        // Show the link until onboarding is explicitly dismissed.
        // We treat "no center doc yet" as "definitely not dismissed"
        // so brand-new owners see Setup immediately.
        const dismissed = !!data?.onboarding?.dismissedAt;
        setSetupOpen(!dismissed);
      },
      () => setSetupOpen(false)
    );
    return unsub;
  }, [user?.uid, isOwner]);

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
    const first = profile?.firstName?.trim();
    const last = profile?.lastName?.trim();
    if (first || last) return [first, last].filter(Boolean).join(' ');
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Your account';
  };

  const getUserRole = () => {
    if (role && ROLE_LABELS[role]) return ROLE_LABELS[role];
    if (profile?.centerName) return profile.centerName;
    return 'Owner';
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
                  {item.tierFeature && (
                    <TierBadge feature={item.tierFeature} />
                  )}
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

      {/* Discovery / upgrade CTA — gradient pill so it reads as a
         marketing surface, not a workflow entry. Sits between the main
         nav and Settings so it's in the bottom half of the sidebar
         where the eye settles after a scan. */}
      <div className="px-3 pt-3 pb-1 border-t border-surface-100">
        {discoveryNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              title={collapsed && !isMobile ? item.name : undefined}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-accent-500 to-brand-500 text-white shadow-brand'
                  : 'text-brand-700 hover:text-white hover:bg-gradient-to-br hover:from-accent-500 hover:to-brand-500 hover:shadow-brand'
              } ${collapsed && !isMobile ? 'justify-center' : ''}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="text-sm sm:text-base font-semibold">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Continue setup — surfaced for owners who haven't dismissed
         the welcome wizard. Disappears the moment they click "I'll
         finish later" on /welcome (markOnboardingDismissed stamps
         centers/{ownerId}.onboarding.dismissedAt). Lives just above
         Settings so it's the last thing the eye lands on after a scan,
         right where new owners are most likely to look for "what's next". */}
      {setupOpen && (
        <div className="px-3 pt-3 pb-1 border-t border-surface-100">
          <NavLink
            to="/welcome"
            onClick={handleNavClick}
            title={collapsed && !isMobile ? 'Continue setup' : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                isActive
                  ? 'bg-success-100 text-success-800'
                  : 'text-surface-700 hover:bg-success-50 hover:text-success-800'
              } ${collapsed && !isMobile ? 'justify-center' : ''}`
            }
          >
            <Rocket className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && (
              <span className="text-sm sm:text-base font-semibold">
                Continue setup
              </span>
            )}
            {(!collapsed || isMobile) && (
              <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-success-500" />
            )}
          </NavLink>
        </div>
      )}

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
