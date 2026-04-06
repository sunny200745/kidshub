import React, { useState } from 'react';
import { Calendar, Clock, Utensils, Moon, Palette, Baby, Camera } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Badge } from '../components/ui';
import { ActivityIcon, activityLabels, activityColors } from '../components/icons/ActivityIcons';
import { todaysActivities, myChildren } from '../data/mockData';

const filterOptions = [
  { id: 'all', label: 'All', icon: null },
  { id: 'meal', label: 'Meals', icon: Utensils },
  { id: 'nap', label: 'Naps', icon: Moon },
  { id: 'activity', label: 'Activities', icon: Palette },
  { id: 'diaper', label: 'Diaper', icon: Baby },
];

function ActivityCard({ activity }) {
  const time = new Date(activity.time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Card className="overflow-hidden hover:shadow-soft-lg transition-shadow">
      <CardBody className="p-4 sm:p-5">
        <div className="flex gap-4">
          <ActivityIcon type={activity.type} size="lg" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-surface-900">{activity.title}</h3>
                <p className="text-sm text-surface-500 mt-0.5">{activity.description}</p>
              </div>
              <span className="text-xs text-surface-400 flex-shrink-0 bg-surface-100 px-2 py-1 rounded-lg">
                {time}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-surface-400">by {activity.staffName}</span>
              {activity.hasPhoto && (
                <Badge variant="info" className="gap-1">
                  <Camera className="w-3 h-3" />
                  Photo
                </Badge>
              )}
              {activity.details?.amount && (
                <Badge variant="neutral">Ate: {activity.details.amount}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function NapStatusCard() {
  const napActivity = todaysActivities.find(a => a.type === 'nap' && a.details?.status === 'Sleeping');
  if (!napActivity) return null;

  const startTime = new Date(napActivity.details.startTime);
  const now = new Date();
  const duration = Math.floor((now - startTime) / (1000 * 60));

  return (
    <Card className="bg-gradient-to-r from-info-500 to-info-600 text-white border-0">
      <CardBody className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Moon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Currently Napping</p>
            <p className="text-2xl sm:text-3xl font-bold">{duration} minutes</p>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Started at {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Activity() {
  const [activeFilter, setActiveFilter] = useState('all');
  const child = myChildren[0];

  const filteredActivities = activeFilter === 'all'
    ? todaysActivities
    : todaysActivities.filter(a => a.type === activeFilter || (a.type === 'snack' && activeFilter === 'meal'));

  return (
    <Layout 
      title="Activity Feed" 
      subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      <div className="max-w-3xl mx-auto">
        {/* Child Info Header */}
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: child.classroomColor }}
          >
            {child.firstName[0]}
          </div>
          <div>
            <h2 className="font-semibold text-surface-900">{child.firstName}'s Day</h2>
            <p className="text-sm text-surface-500">{child.classroom}</p>
          </div>
        </div>

        {/* Nap Status */}
        <div className="mb-6">
          <NapStatusCard />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-brand-500 text-white shadow-brand'
                    : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-surface-400">No activities found</p>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  );
}
