import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Grid,
  List,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Baby,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  Avatar,
  Badge,
  StatusBadge,
  Button,
  SearchInput,
  Select,
  LoadingPage,
  LoadingCards,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import { ChildFormModal } from '../components/modals';
import { childrenApi } from '../firebase/api';
import { useChildrenData, useClassroomsData } from '../hooks';

function ChildCard({ child, classrooms, onEdit, onDelete }) {
  const classroom = classrooms?.find(c => c.id === child.classroom);

  const formatCheckInTime = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const stopLinkNav = (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.(child);
  };

  return (
    <div className="relative group">
      <Link to={`/children/${child.id}`}>
      <Card hover className="h-full">
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={`${child.firstName} ${child.lastName}`}
              size="xl"
              className="mb-3"
            />
            <h3 className="font-semibold text-surface-900 text-sm sm:text-base">
              {child.firstName} {child.lastName}
            </h3>
            <p className="text-xs sm:text-sm text-surface-500 mt-0.5">{child.age}</p>

            <div className="flex items-center gap-1.5 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: classroom?.color }}
              />
              <span className="text-xs text-surface-500">{classroom?.name}</span>
            </div>

            <div className="mt-3">
              <StatusBadge status={child.status} />
            </div>

            {child.status === 'checked-in' && child.checkInTime && (
              <p className="text-xs text-surface-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Since {formatCheckInTime(child.checkInTime)}
              </p>
            )}

            {child.allergies?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {child.allergies.slice(0, 2).map((allergy) => (
                  <Badge key={allergy} variant="danger">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="truncate max-w-[60px] sm:max-w-none">{allergy}</span>
                  </Badge>
                ))}
                {child.allergies.length > 2 && (
                  <Badge variant="danger">+{child.allergies.length - 2}</Badge>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      </Link>

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onEdit)}
          title="Edit child"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-brand-600 hover:bg-white shadow-sm">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onDelete)}
          title="Delete child"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-danger-600 hover:bg-white shadow-sm">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ChildListItem({ child, classrooms, onEdit, onDelete }) {
  const classroom = classrooms?.find(c => c.id === child.classroom);

  const stopLinkNav = (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.(child);
  };

  const formatCheckInTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="group relative">
      <Link
        to={`/children/${child.id}`}
        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-surface-50 transition-colors">
        <Avatar
          name={`${child.firstName} ${child.lastName}`}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-surface-900 text-sm sm:text-base">
              {child.firstName} {child.lastName}
            </h3>
            {child.allergies?.length > 0 && (
              <Badge variant="danger" className="hidden sm:inline-flex">
                <AlertTriangle className="w-3 h-3" />
                Allergies
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
            <span className="text-xs sm:text-sm text-surface-500">{child.age}</span>
            <span className="text-surface-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: classroom?.color }}
              />
              <span className="text-xs sm:text-sm text-surface-500 truncate">{classroom?.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-3">
          <div>
            <StatusBadge status={child.status} />
            {child.status === 'checked-in' && (
              <p className="text-xs text-surface-400 mt-1 hidden sm:block">
                {formatCheckInTime(child.checkInTime)}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onEdit)}
          title="Edit child"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-brand-600 hover:bg-white shadow-sm">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onDelete)}
          title="Delete child"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-danger-600 hover:bg-white shadow-sm">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Children() {
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [classroomFilter, setClassroomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [deletingChild, setDeletingChild] = useState(null);

  const openAdd = () => {
    setEditingChild(null);
    setShowFormModal(true);
  };
  const openEdit = (child) => {
    setEditingChild(child);
    setShowFormModal(true);
  };
  const closeForm = () => {
    setShowFormModal(false);
    setEditingChild(null);
  };

  const linkedParentCount = deletingChild
    ? (Array.isArray(deletingChild.parentIds) ? deletingChild.parentIds.length : 0) ||
      (Array.isArray(deletingChild.parents) ? deletingChild.parents.length : 0)
    : 0;
  const childDeleteBlockedReason =
    linkedParentCount > 0
      ? `This child still has ${linkedParentCount} linked ${linkedParentCount === 1 ? 'parent' : 'parents'}. Open the child profile, go to Contacts, and unlink them first.`
      : null;

  const loading = childrenLoading || classroomsLoading;

  const filteredChildren = children?.filter((child) => {
    const matchesSearch =
      `${child.firstName} ${child.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesClassroom =
      classroomFilter === 'all' || child.classroom === classroomFilter;
    const matchesStatus =
      statusFilter === 'all' || child.status === statusFilter;
    return matchesSearch && matchesClassroom && matchesStatus;
  }) || [];

  const classroomOptions = [
    { value: 'all', label: 'All Classrooms' },
    ...(classrooms?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'checked-in', label: 'Checked In' },
    { value: 'absent', label: 'Absent' },
  ];

  const checkedInCount = children?.filter((c) => c.status === 'checked-in').length || 0;
  const absentCount = children?.filter((c) => c.status !== 'checked-in').length || 0;

  if (loading) {
    return (
      <Layout title="Children" subtitle="Loading...">
        <LoadingCards count={8} />
      </Layout>
    );
  }

  return (
    <Layout
      title="Children"
      subtitle={`${children?.length || 0} enrolled children`}
      actions={
        <Button icon={Plus} onClick={openAdd} className="hidden sm:inline-flex">Add Child</Button>
      }
    >
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-success-50 text-success-700 rounded-lg sm:rounded-xl">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">{checkedInCount} Checked In</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface-100 text-surface-600 rounded-lg sm:rounded-xl">
          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">{absentCount} Absent</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search children..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Select
                options={classroomOptions}
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                className="flex-1 min-w-[140px] sm:flex-none sm:w-40"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-[120px] sm:flex-none sm:w-36"
              />
              <div className="flex border border-surface-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 ${
                    viewMode === 'grid'
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-surface-500 hover:bg-surface-50'
                  }`}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-2.5 ${
                    viewMode === 'list'
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-surface-500 hover:bg-surface-50'
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Mobile Add Button */}
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={openAdd} className="w-full">Add Child</Button>
      </div>

      {/* Children Display */}
      {filteredChildren.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                classrooms={classrooms}
                onEdit={openEdit}
                onDelete={setDeletingChild}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-surface-100">
              {filteredChildren.map((child) => (
                <ChildListItem
                  key={child.id}
                  child={child}
                  classrooms={classrooms}
                  onEdit={openEdit}
                  onDelete={setDeletingChild}
                />
              ))}
            </div>
          </Card>
        )
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={Baby}
              title="No children found"
              description="Try adjusting your filters or add a new child."
            />
          </CardBody>
        </Card>
      )}

      <ChildFormModal
        isOpen={showFormModal}
        onClose={closeForm}
        child={editingChild}
      />

      <ConfirmDialog
        isOpen={!!deletingChild}
        onClose={() => setDeletingChild(null)}
        onConfirm={async () => {
          if (!deletingChild) return;
          await childrenApi.deleteWithDependents(deletingChild.id);
        }}
        title="Delete child"
        message={
          deletingChild
            ? `This will permanently delete ${deletingChild.firstName} ${deletingChild.lastName} along with their activity log and messages. This can't be undone.`
            : ''
        }
        confirmLabel="Delete child"
        blocked={!!childDeleteBlockedReason}
        blockedReason={childDeleteBlockedReason}
      />
    </Layout>
  );
}
