import React, { useState } from 'react';
import { Plus, Mail, Phone, Award, Calendar, Users } from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  Avatar,
  Badge,
  Button,
  SearchInput,
  Select,
  Modal,
  ModalFooter,
  LoadingCards,
  EmptyState,
} from '../components/ui';
import { AddStaffModal } from '../components/modals';
import { useStaffData, useClassroomsData } from '../hooks';

function StaffCard({ member, classrooms, onClick }) {
  const classroom = member.classroom ? classrooms?.find(c => c.id === member.classroom) : null;

  const statusColors = {
    online: 'bg-success-500',
    away: 'bg-warning-500',
    offline: 'bg-surface-300',
  };

  return (
    <Card hover className="cursor-pointer" onClick={() => onClick(member)}>
      <CardBody className="p-4 sm:p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar
              name={`${member.firstName} ${member.lastName}`}
              size="xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ring-2 ring-white ${statusColors[member.status]}`}
            />
          </div>

          <h3 className="font-semibold text-surface-900 mt-3 text-sm sm:text-base">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-xs sm:text-sm text-brand-600 font-medium">{member.role}</p>

          {classroom && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: classroom.color }}
              />
              <span className="text-xs text-surface-500">{classroom.name}</span>
            </div>
          )}

          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-1.5 justify-center">
            {member.certifications?.slice(0, 2).map((cert) => (
              <Badge key={cert} variant="info" className="text-xs">
                {cert}
              </Badge>
            ))}
            {member.certifications?.length > 2 && (
              <Badge variant="neutral" className="text-xs">+{member.certifications.length - 2}</Badge>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function StaffModal({ member, classrooms, isOpen, onClose }) {
  if (!member) return null;

  const classroom = member.classroom ? classrooms?.find(c => c.id === member.classroom) : null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Details" size="md">
      <div className="text-center mb-4 sm:mb-6">
        <Avatar
          name={`${member.firstName} ${member.lastName}`}
          size="2xl"
          className="mx-auto mb-3 sm:mb-4"
        />
        <h2 className="text-lg sm:text-xl font-bold text-surface-900">
          {member.firstName} {member.lastName}
        </h2>
        <p className="text-brand-600 font-medium text-sm sm:text-base">{member.role}</p>
        {classroom && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: classroom.color }}
            />
            <span className="text-sm text-surface-500">{classroom.name}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
          <Mail className="w-5 h-5 text-surface-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-surface-400">Email</p>
            <a href={`mailto:${member.email}`} className="text-sm text-brand-600 hover:underline truncate block">
              {member.email}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
          <Phone className="w-5 h-5 text-surface-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-400">Phone</p>
            <a href={`tel:${member.phone}`} className="text-sm text-brand-600 hover:underline">
              {member.phone}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
          <Calendar className="w-5 h-5 text-surface-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-400">Hire Date</p>
            <p className="text-sm text-surface-900">{formatDate(member.hireDate)}</p>
          </div>
        </div>

        <div className="p-3 bg-surface-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-surface-400" />
            <p className="text-xs text-surface-400">Certifications</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {member.certifications?.map((cert) => (
              <Badge key={cert} variant="info">
                {cert}
              </Badge>
            ))}
          </div>
        </div>

        {member.bio && (
          <div className="p-3 bg-surface-50 rounded-xl">
            <p className="text-xs text-surface-400 mb-1">Bio</p>
            <p className="text-sm text-surface-700">{member.bio}</p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button icon={Mail}>Send Message</Button>
      </ModalFooter>
    </Modal>
  );
}

export default function Staff() {
  const { data: staff, loading: staffLoading } = useStaffData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loading = staffLoading || classroomsLoading;

  const roles = [...new Set(staff?.map((s) => s.role) || [])];
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    ...roles.map((role) => ({ value: role, label: role })),
  ];

  const filteredStaff = staff?.filter((member) => {
    const matchesSearch = `${member.firstName} ${member.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const onlineCount = staff?.filter((s) => s.status === 'online').length || 0;
  const awayCount = staff?.filter((s) => s.status === 'away').length || 0;

  if (loading) {
    return (
      <Layout title="Staff" subtitle="Loading...">
        <LoadingCards count={6} />
      </Layout>
    );
  }

  return (
    <Layout
      title="Staff"
      subtitle={`${staff?.length || 0} team members`}
      actions={<Button icon={Plus} onClick={() => setShowAddModal(true)} className="hidden sm:inline-flex">Add Staff</Button>}
    >
      {/* Status Summary */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-success-50 text-success-700 rounded-lg sm:rounded-xl">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-success-500 rounded-full" />
          <span className="text-xs sm:text-sm font-medium">{onlineCount} Online</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-warning-50 text-warning-700 rounded-lg sm:rounded-xl">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-warning-500 rounded-full" />
          <span className="text-xs sm:text-sm font-medium">{awayCount} Away</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
        </CardBody>
      </Card>

      {/* Mobile Add Button */}
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={() => setShowAddModal(true)} className="w-full">Add Staff</Button>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              classrooms={classrooms}
              onClick={setSelectedStaff}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={Users}
              title="No staff members found"
              description="Try adjusting your search or filters"
            />
          </CardBody>
        </Card>
      )}

      {/* Staff Detail Modal */}
      <StaffModal
        member={selectedStaff}
        classrooms={classrooms}
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
      />

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => setShowAddModal(false)}
      />
    </Layout>
  );
}
