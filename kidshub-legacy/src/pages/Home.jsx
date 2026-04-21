import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  ChevronRight, 
  Utensils, 
  Moon,
  Camera,
  MessageSquare,
  FileText,
  LogIn,
  Bell,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Avatar, Badge } from '../components/ui';
import { ActivityIcon, activityLabels } from '../components/icons/ActivityIcons';
import { myChildren, todaysActivities, announcements } from '../data/mockData';

function ChildStatusCard({ child }) {
  const isCheckedIn = child.status === 'checked-in';
  const checkInTime = new Date(child.checkInTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Card className="overflow-hidden">
      <div 
        className="h-2" 
        style={{ backgroundColor: child.classroomColor }}
      />
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Avatar name={`${child.firstName} ${child.lastName}`} size="xl" />
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-surface-900">
              {child.firstName} {child.lastName}
            </h2>
            <p className="text-sm text-surface-500">{child.classroom}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-success-500' : 'bg-surface-300'}`} />
                <span className="text-sm text-surface-600">
                  {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                </span>
              </div>
              {isCheckedIn && (
                <div className="flex items-center gap-1.5 text-surface-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm">{checkInTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-100">
          <QuickStat icon={Utensils} label="Meals" value="2" color="warning" />
          <QuickStat icon={Moon} label="Nap" value="Sleeping" color="info" />
          <QuickStat icon={Camera} label="Photos" value="3" color="brand" />
        </div>
      </CardBody>
    </Card>
  );
}

function QuickStat({ icon: Icon, label, value, color }) {
  const colorClasses = {
    warning: 'bg-warning-100 text-warning-600',
    info: 'bg-info-100 text-info-600',
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-success-100 text-success-600',
  };

  return (
    <div className="text-center">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <p className="text-xs text-surface-500">{label}</p>
      <p className="text-sm font-medium text-surface-900">{value}</p>
    </div>
  );
}

function ActivityPreview() {
  const recentActivities = todaysActivities.slice(0, 4);

  return (
    <Card>
      <CardBody className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-900">Recent Activity</h3>
          <Link to="/activity" className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <ActivityIcon type={activity.type} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900">{activity.title}</p>
                <p className="text-xs text-surface-500 truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-surface-400 flex-shrink-0">
                {new Date(activity.time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function AnnouncementBanner() {
  const highPriority = announcements.find(a => a.priority === 'high');
  if (!highPriority) return null;

  return (
    <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-warning-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-warning-800">{highPriority.title}</p>
          <p className="text-xs text-warning-600 mt-0.5">{highPriority.content}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const child = myChildren[0];
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout title="Home" subtitle={`Here's how ${child.firstName} is doing today`}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Greeting - Mobile only */}
        <div className="lg:hidden">
          <h2 className="text-xl font-bold text-surface-900">{greeting}!</h2>
          <p className="text-surface-500 text-sm">Here's how {child.firstName} is doing today</p>
        </div>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Child Status Card */}
        <ChildStatusCard child={child} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <ActivityPreview />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-surface-900">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/messages">
                <Card hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900">Message</p>
                      <p className="text-xs text-surface-500 truncate">Chat with teacher</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/activity">
                <Card hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900">Daily Report</p>
                      <p className="text-xs text-surface-500 truncate">View full details</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/photos">
                <Card hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-info-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900">Photos</p>
                      <p className="text-xs text-surface-500 truncate">View gallery</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/schedule">
                <Card hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900">Schedule</p>
                      <p className="text-xs text-surface-500 truncate">Daily routine</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
