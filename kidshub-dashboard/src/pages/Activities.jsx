import React, { useState } from 'react';
import {
  Plus,
  Utensils,
  Moon,
  Baby,
  Smile,
  Camera,
  FileText,
  TreePine,
  BookOpen,
  AlertTriangle,
  Pill,
  Star,
  Activity,
  Apple,
  Toilet,
  Palette,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Badge,
  Button,
  Modal,
  ModalFooter,
  Select,
  Textarea,
  SearchInput,
  LoadingPage,
  EmptyState,
} from '../components/ui';
import { ActivityIcon, activityLabels, activityColors } from '../components/icons/ActivityIcons';
import { useActivitiesData, useChildrenData, useStaffData, useClassroomsData } from '../hooks';
import { activitiesApi } from '../firebase/api';

const activityOptions = [
  { type: 'meal', icon: Utensils, label: 'Meal', color: 'bg-warning-100 text-warning-600' },
  { type: 'snack', icon: Apple, label: 'Snack', color: 'bg-warning-100 text-warning-600' },
  { type: 'nap', icon: Moon, label: 'Nap', color: 'bg-info-100 text-info-600' },
  { type: 'diaper', icon: Baby, label: 'Diaper', color: 'bg-accent-100 text-accent-600' },
  { type: 'potty', icon: Toilet, label: 'Potty', color: 'bg-accent-100 text-accent-600' },
  { type: 'activity', icon: Palette, label: 'Activity', color: 'bg-success-100 text-success-600' },
  { type: 'outdoor', icon: TreePine, label: 'Outdoor', color: 'bg-success-100 text-success-600' },
  { type: 'learning', icon: BookOpen, label: 'Learning', color: 'bg-brand-100 text-brand-600' },
  { type: 'mood', icon: Smile, label: 'Mood', color: 'bg-brand-100 text-brand-600' },
  { type: 'photo', icon: Camera, label: 'Photo', color: 'bg-info-100 text-info-600' },
  { type: 'note', icon: FileText, label: 'Note', color: 'bg-surface-100 text-surface-600' },
  { type: 'incident', icon: AlertTriangle, label: 'Incident', color: 'bg-danger-100 text-danger-600' },
  { type: 'medication', icon: Pill, label: 'Medication', color: 'bg-danger-100 text-danger-600' },
  { type: 'milestone', icon: Star, label: 'Milestone', color: 'bg-warning-100 text-warning-600' },
];

function ActivityCard({ activity, children, staff }) {
  const child = children?.find(c => c.id === activity.childId);
  const staffMember = staff?.find(s => s.id === activity.staffId);
  const colors = activityColors[activity.type] || activityColors.note;
  const label = activityLabels[activity.type] || activity.type;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getVariant = (type) => {
    const variants = {
      meal: 'warning', snack: 'warning', nap: 'info', diaper: 'neutral',
      potty: 'neutral', activity: 'success', outdoor: 'success',
      learning: 'brand', mood: 'brand', incident: 'danger',
      medication: 'danger', milestone: 'warning', photo: 'info',
      note: 'neutral', checkin: 'success', checkout: 'info',
    };
    return variants[type] || 'neutral';
  };

  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-surface-50 rounded-xl transition-colors">
      <ActivityIcon type={activity.type} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-surface-900 text-sm sm:text-base truncate">
                {child?.firstName} {child?.lastName}
              </span>
              <Badge variant={getVariant(activity.type)} className="text-xs">
                {label}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-surface-600 mt-0.5 line-clamp-2">{activity.notes}</p>
            <p className="text-xs text-surface-400 mt-1">
              by {staffMember?.firstName} {staffMember?.lastName}
            </p>
          </div>
          <span className="text-xs text-surface-400 whitespace-nowrap flex-shrink-0">
            {formatTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

function NewActivityModal({ isOpen, onClose, children }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredChildren = children?.filter((child) =>
    `${child.firstName} ${child.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  ) || [];

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedChild(null);
    setNotes('');
    setSearchQuery('');
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        await activitiesApi.create({
        childId: selectedChild.id,
        type: selectedType,
        staffId: 'staff-1',
        notes: notes || `${activityLabels[selectedType] || selectedType} logged`,
        details: {},
      });
      handleClose();
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = selectedType
    ? activityOptions.find((a) => a.type === selectedType)?.icon
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === 1
          ? 'Select Activity Type'
          : step === 2
          ? 'Select Child'
          : 'Add Details'
      }
      size="lg"
    >
      {step === 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {activityOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                setSelectedType(option.type);
                setStep(2);
              }}
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 rounded-xl hover:bg-surface-50 transition-colors border border-surface-100 hover:border-brand-200"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${option.color}`}
              >
                <option.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-surface-700 text-center">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <SearchInput
            placeholder="Search children..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-60 sm:max-h-80 overflow-y-auto space-y-2">
            {filteredChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  setStep(3);
                }}
                className="w-full flex items-center gap-3 p-2 sm:p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
              >
                <Avatar
                  name={`${child.firstName} ${child.lastName}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 text-sm sm:text-base truncate">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-xs sm:text-sm text-surface-500">{child.age}</p>
                </div>
                {child.allergies?.length > 0 && (
                  <Badge variant="danger">
                    <AlertTriangle className="w-3 h-3" />
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
          </ModalFooter>
        </div>
      )}

      {step === 3 && selectedChild && (
        <div>
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-50 rounded-xl mb-4 sm:mb-6">
            <Avatar
              name={`${selectedChild.firstName} ${selectedChild.lastName}`}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 text-sm sm:text-base truncate">
                {selectedChild.firstName} {selectedChild.lastName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {SelectedIcon && (
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center ${
                      activityOptions.find((a) => a.type === selectedType)?.color
                    }`}
                  >
                    <SelectedIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                )}
                <span className="text-xs sm:text-sm text-surface-500">
                  {activityOptions.find((a) => a.type === selectedType)?.label}
                </span>
              </div>
            </div>
          </div>

          <Textarea
            label="Notes"
            placeholder="Add details about this activity..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />

          <ModalFooter>
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Log Activity
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}

export default function Activities() {
  const { data: activities, loading: activitiesLoading } = useActivitiesData();
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: staff, loading: staffLoading } = useStaffData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterClassroom, setFilterClassroom] = useState('all');

  const loading = activitiesLoading || childrenLoading || staffLoading || classroomsLoading;

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...activityOptions.map((a) => ({ value: a.type, label: a.label })),
  ];

  const classroomOptions = [
    { value: 'all', label: 'All Classrooms' },
    ...(classrooms?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const filteredActivities = activities?.filter((activity) => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const child = children?.find(c => c.id === activity.childId);
    const matchesClassroom =
      filterClassroom === 'all' || child?.classroom === filterClassroom;
    return matchesType && matchesClassroom;
  }) || [];

  if (loading) {
    return (
      <Layout title="Activities" subtitle="Loading...">
        <LoadingPage message="Loading activities..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Activities"
      subtitle={`${activities?.length || 0} activities logged today`}
      actions={
        <Button icon={Plus} onClick={() => setShowNewModal(true)} className="hidden sm:inline-flex">
          Log Activity
        </Button>
      }
    >
      {/* Quick Actions */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <h3 className="text-xs sm:text-sm font-medium text-surface-700 mb-2 sm:mb-3">
            Quick Log
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {activityOptions.slice(0, 8).map((option) => (
              <button
                key={option.type}
                onClick={() => setShowNewModal(true)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-colors border border-surface-100 hover:border-brand-200 ${option.color}`}
              >
                <option.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Mobile Add Button */}
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={() => setShowNewModal(true)} className="w-full">
          Log Activity
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Select
              options={typeOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-44"
            />
            <Select
              options={classroomOptions}
              value={filterClassroom}
              onChange={(e) => setFilterClassroom(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
        </CardBody>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader className="px-3 sm:px-5 py-3 sm:py-4">
          <h2 className="font-semibold text-surface-900 text-sm sm:text-base">Today's Activities</h2>
        </CardHeader>
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                children={children}
                staff={staff}
              />
            ))}
          </div>
        ) : (
          <CardBody>
            <EmptyState
              icon={Activity}
              title="No activities found"
              description="Start logging activities using the Quick Log buttons"
              action={() => setShowNewModal(true)}
              actionLabel="Log Activity"
            />
          </CardBody>
        )}
      </Card>

      {/* New Activity Modal */}
      <NewActivityModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        children={children}
      />
    </Layout>
  );
}
