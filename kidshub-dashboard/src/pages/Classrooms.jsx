import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Users,
  Baby,
  ArrowLeft,
  Plus,
  Calendar,
  School,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  StatusBadge,
  LoadingPage,
  LoadingCards,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import { ClassroomFormModal } from '../components/modals';
import { classroomsApi } from '../firebase/api';
import { useClassroomsData, useClassroom, useChildrenData, useStaffData } from '../hooks';

/**
 * Build the blocked-delete reason for a classroom based on its dependencies.
 * Returns null if the classroom can be safely deleted, or an explanation
 * string otherwise. Owners must reassign or remove children and staff before
 * the classroom row can go away (strict enforcement per the `block_with_deps`
 * policy; we do NOT cascade-delete kids or teachers).
 */
function classroomDeleteBlockedReason({ classroom, children, staff }) {
  if (!classroom) return null;
  const childCount = (children || []).filter(
    (c) => c.classroom === classroom.id || c.classroomId === classroom.id
  ).length;
  const staffCount = (staff || []).filter(
    (s) => s.classroom === classroom.id || s.classroomId === classroom.id
  ).length;

  if (childCount === 0 && staffCount === 0) return null;

  const parts = [];
  if (childCount > 0) parts.push(`${childCount} ${childCount === 1 ? 'child' : 'children'}`);
  if (staffCount > 0) parts.push(`${staffCount} ${staffCount === 1 ? 'staff member' : 'staff members'}`);
  return `This classroom still has ${parts.join(' and ')} assigned. Reassign or remove them first, then you can delete the classroom.`;
}

function ClassroomCard({ classroom, children, staff, onEdit, onDelete }) {
  // Derive counts from the live children/staff arrays. We used to read
  // `classroom.currentCount` but nothing keeps that counter in sync on
  // create/update/delete — the card would keep showing 0/N forever even
  // after assigning kids. Always compute from source.
  const childrenInClass = (children || []).filter(
    (c) => c.classroom === classroom.id || c.classroomId === classroom.id
  );
  const staffInClass = (staff || []).filter(
    (s) => s.classroom === classroom.id || s.classroomId === classroom.id
  );
  const childCount = childrenInClass.length;
  const checkedInCount = childrenInClass.filter((c) => c.status === 'checked-in').length;
  const capacity = classroom.capacity || 0;
  const occupancyPercent = capacity > 0 ? (childCount / capacity) * 100 : 0;

  // Prevent Link navigation when clicking action buttons.
  const stopLinkNav = (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.(classroom);
  };

  return (
    <div className="relative group">
      <Link to={`/classrooms/${classroom.id}`}>
        <Card hover className="h-full">
          <CardBody className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold"
                style={{ backgroundColor: classroom.color }}>
                {classroom.name.charAt(0)}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={occupancyPercent >= 90 ? 'danger' : occupancyPercent >= 70 ? 'warning' : 'success'}>
                  {childCount}/{capacity}
                </Badge>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-surface-900">{classroom.name}</h3>
            <p className="text-xs sm:text-sm text-surface-500 mt-0.5">{classroom.ageGroup}</p>
            <p className="text-xs text-surface-400">{classroom.ageRange}</p>

            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Baby className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-400" />
                <span className="text-xs sm:text-sm text-surface-600">
                  {checkedInCount}/{childCount} in
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-400" />
                <span className="text-xs sm:text-sm text-surface-600">
                  {staffInClass.length} staff
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4">
              <div className="w-full h-1.5 sm:h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${occupancyPercent}%`,
                    backgroundColor: classroom.color,
                  }}
                />
              </div>
            </div>

            {staffInClass.length > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-surface-100">
                <p className="text-xs text-surface-500 mb-2">Staff</p>
                <AvatarGroup max={3} size="sm">
                  {staffInClass.map((s) => (
                    <Avatar
                      key={s.id}
                      name={`${s.firstName} ${s.lastName}`}
                      size="sm"
                    />
                  ))}
                </AvatarGroup>
              </div>
            )}
          </CardBody>
        </Card>
      </Link>

      {/* Card-level action overlay — visible on hover (desktop) / always (mobile).
          Rendered absolutely so it sits above the Link but outside its click target. */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity sm:static sm:opacity-100 sm:hidden">
        {/* spacer — keeping semantic alignment w/ capacity badge row */}
      </div>
      <div className="absolute top-3 right-14 sm:right-14 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onEdit)}
          title="Edit classroom"
          className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-surface-500 hover:text-brand-600 hover:bg-white shadow-sm">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => stopLinkNav(e, onDelete)}
          title="Delete classroom"
          className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-surface-500 hover:text-danger-600 hover:bg-white shadow-sm">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ClassroomDetail({ id }) {
  const { data: classroom, loading: classroomLoading } = useClassroom(id);
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: staff, loading: staffLoading } = useStaffData();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loading = classroomLoading || childrenLoading || staffLoading;

  const blockedReason = useMemo(
    () => classroomDeleteBlockedReason({ classroom, children, staff }),
    [classroom, children, staff]
  );

  if (loading) {
    return (
      <Layout title="Loading...">
        <LoadingPage message="Loading classroom..." />
      </Layout>
    );
  }

  if (!classroom) {
    return (
      <Layout title="Classroom Not Found">
        <Card>
          <CardBody>
            <EmptyState
              icon={School}
              title="Classroom not found"
              description="The classroom you're looking for doesn't exist."
              action={() => window.history.back()}
              actionLabel="Go Back"
            />
          </CardBody>
        </Card>
      </Layout>
    );
  }

  const childrenInClass = (children || []).filter(
    (c) => c.classroom === classroom.id || c.classroomId === classroom.id
  );
  const staffInClass = (staff || []).filter(
    (s) => s.classroom === classroom.id || s.classroomId === classroom.id
  );
  const childCount = childrenInClass.length;
  const capacity = classroom.capacity || 0;
  const occupancyPercent = capacity > 0 ? (childCount / capacity) * 100 : 0;
  const schedule = classroom.schedule || [];

  return (
    <Layout
      title={
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/classrooms"
            className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <span className="text-base sm:text-xl truncate">{classroom.name}</span>
        </div>
      }
      subtitle={`${classroom.ageGroup} • ${classroom.ageRange}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="secondary" icon={Trash2} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      }>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardBody className="p-4 sm:p-5">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4"
                style={{ backgroundColor: classroom.color }}>
                {classroom.name.charAt(0)}
              </div>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-surface-900">{classroom.name}</h2>
                <p className="text-surface-500 text-sm sm:text-base">{classroom.ageGroup}</p>
                <p className="text-xs sm:text-sm text-surface-400">{classroom.ageRange}</p>
              </div>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-surface-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-surface-500">Capacity</span>
                  <span className="font-semibold text-surface-900 text-sm sm:text-base">
                    {childCount}/{capacity}
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${occupancyPercent}%`,
                      backgroundColor: classroom.color,
                    }}
                  />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-surface-600 mt-4 sm:mt-6">{classroom.description}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="px-4 sm:px-5 py-3 sm:py-4">
              <h3 className="font-semibold text-surface-900 text-sm sm:text-base">Staff</h3>
            </CardHeader>
            <CardBody className="space-y-3 px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              {staffInClass.length > 0 ? (
                staffInClass.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Avatar
                      name={`${s.firstName} ${s.lastName}`}
                      size="md"
                      status={s.status}
                    />
                    <div>
                      <p className="font-medium text-surface-900 text-sm sm:text-base">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs sm:text-sm text-surface-500">{s.role}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-surface-500 text-center py-4">No staff assigned</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-4 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 text-sm sm:text-base">
                  Children ({childrenInClass.length})
                </h3>
                <Button size="sm" icon={Plus} className="hidden sm:inline-flex">
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardBody className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              {childrenInClass.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {childrenInClass.map((child) => (
                    <Link
                      key={child.id}
                      to={`/children/${child.id}`}
                      className="flex items-center gap-3 p-2 sm:p-3 rounded-xl hover:bg-surface-50 transition-colors">
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
                      <StatusBadge status={child.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No children"
                  description="No children enrolled in this classroom"
                />
              )}
            </CardBody>
          </Card>

          {schedule.length > 0 && (
            <Card>
              <CardHeader className="px-4 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />
                  <h3 className="font-semibold text-surface-900 text-sm sm:text-base">Daily Schedule</h3>
                </div>
              </CardHeader>
              <CardBody className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                <div className="space-y-0.5 sm:space-y-1">
                  {schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 sm:gap-4 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-surface-50">
                      <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-surface-500">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <p className="text-surface-900 text-sm sm:text-base">{item.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ClassroomFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        classroom={classroom}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await classroomsApi.delete(classroom.id);
          // Navigate back to the list after delete — the subscribe will drop
          // this classroom, but the detail view is keyed on `id` so we'd
          // render the "not found" state. Explicit nav is nicer UX.
          window.location.assign('/classrooms');
        }}
        title="Delete classroom"
        message={`This will permanently delete "${classroom.name}". This can't be undone.`}
        confirmLabel="Delete classroom"
        blocked={!!blockedReason}
        blockedReason={blockedReason}
      />
    </Layout>
  );
}

export default function Classrooms() {
  const { id } = useParams();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  const { data: children, loading: childrenLoading } = useChildrenData();
  const { data: staff, loading: staffLoading } = useStaffData();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [deletingClassroom, setDeletingClassroom] = useState(null);

  if (id) {
    return <ClassroomDetail id={id} />;
  }

  const loading = classroomsLoading || childrenLoading || staffLoading;

  if (loading) {
    return (
      <Layout title="Classrooms" subtitle="Loading...">
        <LoadingCards count={4} />
      </Layout>
    );
  }

  const openAdd = () => {
    setEditingClassroom(null);
    setShowFormModal(true);
  };
  const openEdit = (classroom) => {
    setEditingClassroom(classroom);
    setShowFormModal(true);
  };
  const closeForm = () => {
    setShowFormModal(false);
    setEditingClassroom(null);
  };

  const blockedReason = classroomDeleteBlockedReason({
    classroom: deletingClassroom,
    children,
    staff,
  });

  return (
    <Layout
      title="Classrooms"
      subtitle={`${classrooms?.length || 0} active classrooms`}
      actions={<Button icon={Plus} onClick={openAdd} className="hidden sm:inline-flex">Add Classroom</Button>}>
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={openAdd} className="w-full">Add Classroom</Button>
      </div>

      {classrooms?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              children={children}
              staff={staff}
              onEdit={openEdit}
              onDelete={setDeletingClassroom}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={School}
              title="No classrooms"
              description="Create your first classroom to get started"
              actionLabel="Add Classroom"
              action={openAdd}
            />
          </CardBody>
        </Card>
      )}

      <ClassroomFormModal
        isOpen={showFormModal}
        onClose={closeForm}
        classroom={editingClassroom}
      />

      <ConfirmDialog
        isOpen={!!deletingClassroom}
        onClose={() => setDeletingClassroom(null)}
        onConfirm={async () => {
          if (!deletingClassroom) return;
          await classroomsApi.delete(deletingClassroom.id);
        }}
        title="Delete classroom"
        message={
          deletingClassroom
            ? `This will permanently delete "${deletingClassroom.name}". This can't be undone.`
            : ''
        }
        confirmLabel="Delete classroom"
        blocked={!!blockedReason}
        blockedReason={blockedReason}
      />
    </Layout>
  );
}
