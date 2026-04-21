import React from 'react';
import { Clock, CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, Badge } from '../components/ui';
import { dailySchedule, myChildren } from '../data/mockData';

function ScheduleItem({ item, index }) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      iconClass: 'text-success-500',
      dotClass: 'bg-success-500',
      textClass: 'text-surface-400',
      lineClass: 'bg-success-200',
    },
    current: {
      icon: PlayCircle,
      iconClass: 'text-brand-500',
      dotClass: 'bg-brand-500 ring-4 ring-brand-100',
      textClass: 'text-brand-600 font-medium',
      lineClass: 'bg-surface-200',
    },
    upcoming: {
      icon: Circle,
      iconClass: 'text-surface-300',
      dotClass: 'bg-surface-300',
      textClass: 'text-surface-600',
      lineClass: 'bg-surface-200',
    },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;
  const isLast = index === dailySchedule.length - 1;

  return (
    <div className="flex gap-4 relative">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${config.dotClass} z-10`} />
        {!isLast && (
          <div className={`w-0.5 flex-1 ${config.lineClass}`} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        <div className={`flex items-center justify-between ${item.status === 'current' ? 'bg-brand-50 -mx-3 px-3 py-2 rounded-xl' : ''}`}>
          <div>
            <p className={`text-sm ${config.textClass}`}>{item.activity}</p>
            <p className="text-xs text-surface-400 mt-0.5">{item.time}</p>
          </div>
          {item.status === 'current' && (
            <Badge variant="brand">Now</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const child = myChildren[0];
  const now = new Date();

  return (
    <Layout 
      title="Daily Schedule" 
      subtitle={now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: child.classroomColor }}
            >
              {child.firstName[0]}
            </div>
            <div>
              <h2 className="font-semibold text-surface-900">{child.classroom}</h2>
              <p className="text-sm text-surface-500">Daily Routine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-surface-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        {/* Schedule Card */}
        <Card>
          <CardBody className="p-5 sm:p-6">
            <div className="space-y-0">
              {dailySchedule.map((item, index) => (
                <ScheduleItem key={index} item={item} index={index} />
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-surface-300" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
