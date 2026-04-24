import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PlanStateBanner } from './PlanStateBanner';

export function Layout({ children, title, subtitle, actions }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-surface-900/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileMenuOpen(false)}
          isMobile={true}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Plan state strip (trial countdown / starter grace / etc.) —
           stops 3-4 of the owner onboarding journey. Renders above the
           header so it's always the first thing in the page flow, and
           returns null on its own for unaffected tiers & suppressed routes. */}
        <PlanStateBanner />
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
