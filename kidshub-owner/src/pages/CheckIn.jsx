import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  Avatar,
  Badge,
  Button,
  Modal,
  ModalFooter,
  Textarea,
  LoadingPage,
  EmptyState,
} from '../components/ui';
import { useChildrenData, useClassroomsData } from '../hooks';
import { childrenApi, activitiesApi } from '../firebase/api';

function ChildCheckCard({ child, classrooms, onCheckIn, onCheckOut }) {
  const classroom = classrooms?.find(c => c.id === child.classroom);
  const isCheckedIn = child.status === 'checked-in';

  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card className={`transition-all ${isCheckedIn ? 'ring-2 ring-success-200' : ''}`}>
      <CardBody className="p-3 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar
            name={`${child.firstName} ${child.lastName}`}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-surface-900 text-sm sm:text-base">
                {child.firstName} {child.lastName}
              </h3>
              {child.allergies?.length > 0 && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3" />
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: classroom?.color }}
              />
              <span className="text-xs sm:text-sm text-surface-500 truncate">{classroom?.name}</span>
            </div>
            {isCheckedIn && child.checkInTime && (
              <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Checked in at {formatTime(child.checkInTime)}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isCheckedIn ? (
              <Button
                variant="secondary"
                icon={UserX}
                onClick={() => onCheckOut(child)}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Check Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            ) : (
              <Button
                icon={UserCheck}
                onClick={() => onCheckIn(child)}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Check In</span>
                <span className="sm:hidden">In</span>
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CheckInModal({ child, isOpen, onClose, onConfirm, type, isProcessing }) {
  const [notes, setNotes] = useState('');
  const [person, setPerson] = useState('');

  const handleConfirm = () => {
    onConfirm({
      notes,
      person,
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      setNotes('');
      setPerson('');
      onClose();
    }
  };

  if (!child) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={type === 'in' ? 'Check In' : 'Check Out'}
      size="md"
    >
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-50 rounded-xl mb-4 sm:mb-6">
        <Avatar
          name={`${child.firstName} ${child.lastName}`}
          size="lg"
        />
        <div>
          <h3 className="font-semibold text-surface-900 text-sm sm:text-base">
            {child.firstName} {child.lastName}
          </h3>
          <p className="text-xs sm:text-sm text-surface-500">{child.age}</p>
        </div>
      </div>

      {child.allergies?.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-danger-50 border border-danger-200 rounded-xl">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-danger-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-danger-700 text-sm sm:text-base">Allergy Alert</p>
              <p className="text-xs sm:text-sm text-danger-600">
                {child.allergies.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {type === 'in' ? 'Dropped off by' : 'Picked up by'}
        </label>
        <input
          type="text"
          className="input"
          placeholder="Parent/Guardian name"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      <Textarea
        label="Notes (optional)"
        placeholder={
          type === 'in'
            ? 'Any notes about the child today...'
            : 'Any notes for pickup...'
        }
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        disabled={isProcessing}
      />

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          icon={type === 'in' ? UserCheck : UserX}
          loading={isProcessing}
          disabled={isProcessing}
        >
          {type === 'in' ? 'Confirm Check In' : 'Confirm Check Out'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default function CheckIn() {
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [checkInChild, setCheckInChild] = useState(null);
  const [checkOutChild, setCheckOutChild] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loading = childrenLoading || classroomsLoading;

  const filteredChildren = children?.filter((child) => {
    const matchesSearch = `${child.firstName} ${child.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'in' && child.status === 'checked-in') ||
      (filter === 'out' && child.status !== 'checked-in');
    return matchesSearch && matchesFilter;
  }) || [];

  const checkedInCount = children?.filter((c) => c.status === 'checked-in').length || 0;
  const notCheckedInCount = children?.filter((c) => c.status !== 'checked-in').length || 0;

  const handleCheckIn = async (data) => {
    if (!checkInChild) return;
    setIsProcessing(true);
    try {
      await childrenApi.checkIn(checkInChild.id, data.person, data.notes);
      await activitiesApi.logCheckIn(checkInChild.id, 'staff-1', data.person, data.notes);
      setCheckInChild(null);
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (data) => {
    if (!checkOutChild) return;
    setIsProcessing(true);
    try {
      await childrenApi.checkOut(checkOutChild.id, data.person, data.notes);
      await activitiesApi.logCheckOut(checkOutChild.id, 'staff-1', data.person, data.notes);
      setCheckOutChild(null);
    } catch (error) {
      console.error('Error checking out:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Check In / Out" subtitle="Loading...">
        <LoadingPage message="Loading attendance..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Check In / Out"
      subtitle="Manage daily attendance"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardBody className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-surface-900">{checkedInCount}</p>
              <p className="text-xs sm:text-sm text-surface-500">Checked In</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-surface-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-surface-900">{notCheckedInCount}</p>
              <p className="text-xs sm:text-sm text-surface-500">Not In</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-2 sm:gap-4 p-3 sm:p-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-surface-900">{children?.length || 0}</p>
              <p className="text-xs sm:text-sm text-surface-500">Total</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />
              <input
                type="search"
                placeholder="Search children..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 sm:pl-10 text-sm"
              />
            </div>
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { value: 'all', label: 'All', count: children?.length || 0 },
                { value: 'in', label: 'In', count: checkedInCount },
                { value: 'out', label: 'Not In', count: notCheckedInCount },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    filter === option.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Children List */}
      {filteredChildren.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {filteredChildren.map((child) => (
            <ChildCheckCard
              key={child.id}
              child={child}
              classrooms={classrooms}
              onCheckIn={(c) => setCheckInChild(c)}
              onCheckOut={(c) => setCheckOutChild(c)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={UserCheck}
              title="No children found"
              description="Try adjusting your search or filters"
            />
          </CardBody>
        </Card>
      )}

      {/* Check In Modal */}
      <CheckInModal
        child={checkInChild}
        isOpen={!!checkInChild}
        onClose={() => setCheckInChild(null)}
        onConfirm={handleCheckIn}
        type="in"
        isProcessing={isProcessing}
      />

      {/* Check Out Modal */}
      <CheckInModal
        child={checkOutChild}
        isOpen={!!checkOutChild}
        onClose={() => setCheckOutChild(null)}
        onConfirm={handleCheckOut}
        type="out"
        isProcessing={isProcessing}
      />
    </Layout>
  );
}
