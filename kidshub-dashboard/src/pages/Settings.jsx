import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Building,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Mail,
  Smartphone,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Avatar, Badge, Button } from '../components/ui';

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">{title}</h3>
            {description && (
              <p className="text-sm text-surface-500">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

function SettingsItem({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
      <div>
        <p className="font-medium text-surface-900">{label}</p>
        {description && (
          <p className="text-sm text-surface-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-500' : 'bg-surface-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    activityUpdates: true,
    messages: true,
    announcements: true,
  });

  const [darkMode, setDarkMode] = useState(false);

  return (
    <Layout title="Settings" subtitle="Manage your preferences">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <Avatar name="David Kim" size="xl" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-surface-900">
                  David Kim
                </h2>
                <p className="text-surface-500">Director</p>
                <p className="text-sm text-surface-400">david.kim@example.com</p>
              </div>
              <Button variant="secondary">Edit Profile</Button>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Manage how you receive notifications"
        >
          <SettingsItem
            label="Email Notifications"
            description="Receive notifications via email"
          >
            <Toggle
              checked={notifications.email}
              onChange={(v) =>
                setNotifications({ ...notifications, email: v })
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Push Notifications"
            description="Receive push notifications on your device"
          >
            <Toggle
              checked={notifications.push}
              onChange={(v) =>
                setNotifications({ ...notifications, push: v })
              }
            />
          </SettingsItem>
          <SettingsItem
            label="SMS Notifications"
            description="Receive important alerts via SMS"
          >
            <Toggle
              checked={notifications.sms}
              onChange={(v) =>
                setNotifications({ ...notifications, sms: v })
              }
            />
          </SettingsItem>

          <div className="pt-4 border-t border-surface-100">
            <p className="text-sm font-medium text-surface-700 mb-4">
              Notification Types
            </p>
            <SettingsItem label="Activity Updates">
              <Toggle
                checked={notifications.activityUpdates}
                onChange={(v) =>
                  setNotifications({ ...notifications, activityUpdates: v })
                }
              />
            </SettingsItem>
            <SettingsItem label="Parent Messages">
              <Toggle
                checked={notifications.messages}
                onChange={(v) =>
                  setNotifications({ ...notifications, messages: v })
                }
              />
            </SettingsItem>
            <SettingsItem label="Announcements">
              <Toggle
                checked={notifications.announcements}
                onChange={(v) =>
                  setNotifications({ ...notifications, announcements: v })
                }
              />
            </SettingsItem>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize how KidsHub looks"
        >
          <SettingsItem
            label="Dark Mode"
            description="Use dark theme"
          >
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </SettingsItem>
          <SettingsItem
            label="Language"
            description="Select your preferred language"
          >
            <div className="flex items-center gap-2 text-surface-600">
              <Globe className="w-4 h-4" />
              <span className="text-sm">English (US)</span>
              <ChevronRight className="w-4 h-4 text-surface-400" />
            </div>
          </SettingsItem>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Manage your security settings"
        >
          <SettingsItem
            label="Password"
            description="Last changed 30 days ago"
          >
            <Button variant="secondary" size="sm">
              Change
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
          >
            <Badge variant="success">Enabled</Badge>
          </SettingsItem>
          <SettingsItem
            label="Active Sessions"
            description="Manage your active sessions"
          >
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
        </SettingsSection>

        {/* Center Settings */}
        <SettingsSection
          icon={Building}
          title="Center Settings"
          description="Manage daycare center information"
        >
          <SettingsItem
            label="Center Information"
            description="Name, address, contact details"
          >
            <Button variant="ghost" size="sm">
              Edit
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Operating Hours"
            description="Set your center's hours of operation"
          >
            <Button variant="ghost" size="sm">
              Configure
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Classroom Setup"
            description="Manage classrooms and capacity"
          >
            <Button variant="ghost" size="sm">
              Manage
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
        </SettingsSection>

        {/* Billing */}
        <SettingsSection
          icon={CreditCard}
          title="Billing"
          description="Manage subscription and billing"
        >
          <div className="p-4 bg-brand-50 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="brand">Pro Plan</Badge>
                <p className="text-sm text-surface-600 mt-1">
                  $99/month • Billed monthly
                </p>
              </div>
              <Button variant="secondary" size="sm">
                Upgrade
              </Button>
            </div>
          </div>
          <SettingsItem
            label="Payment Method"
            description="Visa ending in 4242"
          >
            <Button variant="ghost" size="sm">
              Update
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Billing History"
            description="View past invoices"
          >
            <Button variant="ghost" size="sm">
              View
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsItem>
        </SettingsSection>

        {/* Help */}
        <SettingsSection
          icon={HelpCircle}
          title="Help & Support"
          description="Get help with KidsHub"
        >
          <SettingsItem label="Help Center">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="Contact Support">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="What's New">
            <Badge variant="brand">3 updates</Badge>
          </SettingsItem>
          <SettingsItem label="Privacy Policy">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
          <SettingsItem label="Terms of Service">
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </SettingsItem>
        </SettingsSection>

        {/* App Version */}
        <div className="text-center py-4 text-sm text-surface-400">
          <p>KidsHub v1.0.0</p>
          <p className="mt-1">Made with ❤️ for childcare providers</p>
        </div>
      </div>
    </Layout>
  );
}
