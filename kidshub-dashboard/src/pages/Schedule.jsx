import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Badge, Select, LoadingPage, EmptyState } from '../components/ui';
import { useClassroomsData } from '../hooks';

function ScheduleCard({ classroom, currentTime }) {
  const schedule = classroom.schedule || [];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  const getCurrentActivity = () => {
    for (let i = schedule.length - 1; i >= 0; i--) {
      const [time, period] = schedule[i].time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const activityMinutes = hours * 60 + minutes;
      if (currentMinutes >= activityMinutes) {
        return i;
      }
    }
    return 0;
  };

  const currentIndex = getCurrentActivity();

  return (
    <Card>
      <CardHeader className="px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base"
            style={{ backgroundColor: classroom.color }}
          >
            {classroom.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 text-sm sm:text-base">{classroom.name}</h3>
            <p className="text-xs sm:text-sm text-surface-500">{classroom.ageGroup}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-3 sm:px-5 pb-4 sm:pb-5 pt-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] sm:left-[23px] top-2 bottom-2 w-0.5 bg-surface-100" />

          <div className="space-y-0">
            {schedule.map((item, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 sm:gap-4 py-1.5 sm:py-2 relative ${
                    isCurrent ? 'bg-brand-50 -mx-3 sm:-mx-5 px-3 sm:px-5 rounded-lg' : ''
                  }`}
                >
                  {/* Timeline dot */}
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full z-10 flex-shrink-0 ${
                      isCurrent
                        ? 'bg-brand-500 ring-4 ring-brand-100'
                        : isPast
                        ? 'bg-success-500'
                        : 'bg-surface-300'
                    }`}
                  />

                  {/* Time */}
                  <div
                    className={`w-14 sm:w-20 text-xs sm:text-sm font-medium flex-shrink-0 ${
                      isCurrent
                        ? 'text-brand-600'
                        : isPast
                        ? 'text-surface-400'
                        : 'text-surface-500'
                    }`}
                  >
                    {item.time}
                  </div>

                  {/* Activity */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm truncate ${
                        isCurrent
                          ? 'font-medium text-brand-700'
                          : isPast
                          ? 'text-surface-400'
                          : 'text-surface-700'
                      }`}
                    >
                      {item.activity}
                    </p>
                  </div>

                  {/* Current indicator */}
                  {isCurrent && (
                    <Badge variant="brand" className="text-xs flex-shrink-0">Now</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Schedule() {
  const { data: classrooms, loading } = useClassroomsData();
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const today = currentTime;

  const classroomOptions = [
    { value: 'all', label: 'All Classrooms' },
    ...(classrooms?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const filteredClassrooms =
    selectedClassroom === 'all'
      ? classrooms
      : classrooms?.filter((c) => c.id === selectedClassroom);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout title="Daily Schedule" subtitle="Loading...">
        <LoadingPage message="Loading schedules..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Daily Schedule"
      subtitle={<span className="hidden sm:inline">{formatDate(today)}</span>}
    >
      {/* Date Navigator & Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-50 text-brand-700 rounded-lg sm:rounded-xl">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium text-sm">
                  <span className="sm:hidden">{formatShortDate(today)}</span>
                  <span className="hidden sm:inline">Today</span>
                </span>
              </div>
              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />
              <span className="text-xs sm:text-sm text-surface-600">
                {today.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>

            <Select
              options={classroomOptions}
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      {/* Schedule Grid */}
      {filteredClassrooms?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredClassrooms.map((classroom) => (
            <ScheduleCard
              key={classroom.id}
              classroom={classroom}
              currentTime={currentTime}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={Calendar}
              title="No schedules available"
              description="Add classrooms with schedules to see them here"
            />
          </CardBody>
        </Card>
      )}
    </Layout>
  );
}
