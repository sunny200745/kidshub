import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Baby,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Calendar,
  ArrowRight,
  Activity,
  Database,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Avatar, Badge, Button, LoadingPage, EmptyState } from '../components/ui';
import { ActivityIcon, activityLabels, activityColors } from '../components/icons/ActivityIcons';
import {
  useDashboardStats,
  useActivitiesData,
  useChildrenData,
  useClassroomsData,
  useAnnouncementsData,
  useStaffData,
  useParentsData,
} from '../hooks';
import { seedDatabase } from '../firebase/seedData';

function StatCard({ icon: Icon, label, value, subValue, trend, color = 'brand' }) {
  const colorClasses = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    info: 'bg-info-50 text-info-600',
  };

  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs sm:text-sm text-success-600">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3 sm:mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-surface-900">{value}</p>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">{label}</p>
          {subValue && (
            <p className="text-xs text-surface-400 mt-0.5">{subValue}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function ActivityItem({ activity, children, staff }) {
  const child = children?.find(c => c.id === activity.childId);
  const staffMember = staff?.find(s => s.id === activity.staffId);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex gap-3 sm:gap-4 py-3">
      <div className="flex-shrink-0">
        <ActivityIcon type={activity.type} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-900 truncate">
              {child?.firstName} {child?.lastName}
            </p>
            <p className="text-xs sm:text-sm text-surface-600 line-clamp-2">{activity.notes}</p>
          </div>
          <span className="text-xs text-surface-400 whitespace-nowrap flex-shrink-0">
            {formatTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs text-surface-400 mt-1 truncate">
          by {staffMember?.firstName} {staffMember?.lastName}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, description, href, color }) {
  const colorClasses = {
    brand: 'group-hover:bg-brand-500',
    success: 'group-hover:bg-success-500',
    warning: 'group-hover:bg-warning-500',
    info: 'group-hover:bg-info-500',
  };

  return (
    <Link to={href} className="group">
      <Card hover>
        <CardBody className="flex items-center gap-3 sm:gap-4 p-4">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-surface-100 flex items-center justify-center text-surface-600 transition-all duration-200 ${colorClasses[color]} group-hover:text-white flex-shrink-0`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-surface-900 text-sm sm:text-base">{label}</p>
            <p className="text-xs sm:text-sm text-surface-500 truncate">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-surface-300 group-hover:text-brand-500 transition-colors flex-shrink-0 hidden sm:block" />
        </CardBody>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: activities, loading: activitiesLoading } = useActivitiesData();
  const { data: children } = useChildrenData();
  const { data: staff } = useStaffData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  const { data: announcements, loading: announcementsLoading } = useAnnouncementsData();

  const [seeding, setSeeding] = React.useState(false);

  const handleSeedDatabase = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      await seedDatabase();
      window.location.reload();
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Error seeding database. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const isLoading = statsLoading || activitiesLoading || classroomsLoading;
  const hasNoData = !isLoading && children?.length === 0;

  if (isLoading) {
    return (
      <Layout title="Dashboard" subtitle="Loading...">
        <LoadingPage message="Loading dashboard..." />
      </Layout>
    );
  }

  if (hasNoData) {
    return (
      <Layout title="Dashboard" subtitle="Welcome to KidsHub">
        <Card>
          <CardBody className="py-12">
            <EmptyState
              icon={Database}
              title="No Data Found"
              description="It looks like your database is empty. Would you like to seed it with sample data to get started?"
              action={handleSeedDatabase}
              actionLabel={seeding ? 'Seeding...' : 'Seed Database'}
            />
          </CardBody>
        </Card>
      </Layout>
    );
  }

  const todaysActivities = activities?.slice(0, 8) || [];

  return (
    <Layout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          icon={Baby}
          label="Children Present"
          value={stats.checkedIn}
          subValue={`of ${stats.totalChildren} enrolled`}
          color="brand"
        />
        <StatCard
          icon={Users}
          label="Staff on Duty"
          value={stats.staffOnDuty}
          subValue={`of ${stats.totalStaff} total`}
          color="success"
        />
        <StatCard
          icon={Activity}
          label="Activities Today"
          value={stats.activitiesLogged}
          color="info"
        />
        <StatCard
          icon={MessageSquare}
          label="Unread Messages"
          value={stats.unreadMessages}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-surface-900">
                  Today's Activity
                </h2>
                <Link
                  to="/activities"
                  className="text-xs sm:text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardBody className="divide-y divide-surface-100 px-4 sm:px-5 py-2 sm:py-0">
              {todaysActivities.length > 0 ? (
                todaysActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    children={children}
                    staff={staff}
                  />
                ))
              ) : (
                <p className="text-center text-surface-500 py-8">
                  No activities logged yet today
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Announcements */}
          <Card>
            <CardHeader className="px-4 sm:px-5">
              <h2 className="text-base sm:text-lg font-semibold text-surface-900">
                Announcements
              </h2>
            </CardHeader>
            <CardBody className="space-y-4 px-4 sm:px-5">
              {announcements?.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    {announcement.priority === 'high' && (
                      <Badge variant="danger" className="mt-0.5">
                        Important
                      </Badge>
                    )}
                    <h3 className="font-medium text-surface-900 text-sm">
                      {announcement.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-surface-500 line-clamp-2">
                    {announcement.content}
                  </p>
                </div>
              ))}
              {(!announcements || announcements.length === 0) && (
                <p className="text-sm text-surface-500 text-center py-4">
                  No announcements
                </p>
              )}
            </CardBody>
          </Card>

          {/* Classrooms Overview */}
          <Card>
            <CardHeader className="px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-surface-900">
                  Classrooms
                </h2>
                <Link
                  to="/classrooms"
                  className="text-xs sm:text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 sm:space-y-3 px-4 sm:px-5">
              {classrooms?.map((classroom) => (
                <Link
                  key={classroom.id}
                  to={`/classrooms/${classroom.id}`}
                  className="flex items-center justify-between py-2 hover:bg-surface-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: classroom.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-surface-900 text-sm truncate">
                        {classroom.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {classroom.ageGroup}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-medium text-surface-900">
                      {classroom.currentCount}/{classroom.capacity}
                    </p>
                    <div className="w-12 sm:w-16 h-1.5 bg-surface-100 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(classroom.currentCount / classroom.capacity) * 100}%`,
                          backgroundColor: classroom.color,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-6">
        <h2 className="text-base sm:text-lg font-semibold text-surface-900 mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickActionCard
            icon={CheckCircle}
            label="Check In/Out"
            description="Manage attendance"
            href="/check-in"
            color="success"
          />
          <QuickActionCard
            icon={Activity}
            label="Log Activity"
            description="Record meals, naps"
            href="/activities/new"
            color="brand"
          />
          <QuickActionCard
            icon={MessageSquare}
            label="Send Message"
            description="Contact parents"
            href="/messages"
            color="info"
          />
          <QuickActionCard
            icon={Calendar}
            label="View Schedule"
            description="Daily schedule"
            href="/schedule"
            color="warning"
          />
        </div>
      </div>
    </Layout>
  );
}
