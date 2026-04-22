import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  Check,
  Clock,
  Copy,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
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
  ConfirmDialog,
} from '../components/ui';
import { StaffFormModal, InviteTeacherModal } from '../components/modals';
import { useAuth } from '../contexts';
import { invitesApi, staffApi } from '../firebase/api';
import { useStaffData, useClassroomsData } from '../hooks';

const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5191'
).replace(/\/$/, '');

/**
 * Renders the owner-only "Pending invites" section above the Staff grid.
 * Subscribes to invites/{token} where invitedBy == owner uid, sorted newest
 * first by invitesApi.subscribeForOwner. Each row shows email, classroom,
 * expiry, plus actions to copy the URL or revoke.
 */
function PendingInvites({ ownerUid, classrooms }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    if (!ownerUid) {
      setInvites([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = invitesApi.subscribeForOwner(ownerUid, (next) => {
      setInvites(next);
      setLoading(false);
    });
    return unsub;
  }, [ownerUid]);

  // Reset the "Copied!" pill after 2 seconds. Tracking by token (rather than
  // a single boolean) means clicking copy on row B doesn't clear the pill on
  // row A mid-animation.
  useEffect(() => {
    if (!copiedToken) return undefined;
    const handle = setTimeout(() => setCopiedToken(null), 2000);
    return () => clearTimeout(handle);
  }, [copiedToken]);

  const handleCopy = async (token) => {
    const url = `${KIDSHUB_BASE_URL}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
    } catch (err) {
      console.error('[PendingInvites] clipboard write failed:', err);
      window.prompt('Copy this invite link:', url);
    }
  };

  const handleRevoke = async (token, email) => {
    if (!window.confirm(`Revoke the invite for ${email}? They won't be able to use the link.`)) {
      return;
    }
    setRevoking(token);
    try {
      await invitesApi.delete(token);
    } catch (err) {
      console.error('[PendingInvites] delete failed:', err);
      window.alert('Could not revoke the invite. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return null;
  if (invites.length === 0) return null;

  return (
    <Card className="mb-4 sm:mb-6">
      <CardBody className="p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm sm:text-base font-semibold text-surface-900">
            Pending invites
          </h3>
          <Badge variant="info" className="ml-1">{invites.length}</Badge>
        </div>

        <div className="space-y-2">
          {invites.map((invite) => {
            const classroom = classrooms?.find((c) => c.id === invite.classroomId);
            const expiresAt = invite.expiresAt?.toDate
              ? invite.expiresAt.toDate()
              : null;
            const isExpired = expiresAt && expiresAt.getTime() < Date.now();
            const isCopied = copiedToken === invite.token;
            const isRevoking = revoking === invite.token;

            return (
              <div
                key={invite.token}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-surface-900 truncate">
                      {invite.email}
                    </p>
                    {isExpired ? (
                      <Badge variant="danger" className="text-xs">Expired</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-surface-500 flex-wrap">
                    {classroom ? (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: classroom.color }}
                        />
                        {classroom.name}
                      </span>
                    ) : (
                      <span>{invite.classroomName || 'Unknown classroom'}</span>
                    )}
                    {expiresAt ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-2 self-stretch sm:self-auto">
                  <Button
                    variant="secondary"
                    icon={isCopied ? Check : Copy}
                    onClick={() => handleCopy(invite.token)}
                    className={`text-xs sm:text-sm ${
                      isCopied ? 'bg-success-100 text-success-700 hover:bg-success-200' : ''
                    }`}>
                    {isCopied ? 'Copied' : 'Copy link'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(invite.token, invite.email)}
                    disabled={isRevoking}
                    title="Revoke invite"
                    className="p-2 rounded-xl text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function StaffCard({ member, classrooms, onClick, onEdit, onDelete }) {
  const classroom = member.classroom ? classrooms?.find(c => c.id === member.classroom) : null;

  const statusColors = {
    online: 'bg-success-500',
    away: 'bg-warning-500',
    offline: 'bg-surface-300',
  };

  const handleAction = (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.(member);
  };

  return (
    <div className="relative group">
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

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => handleAction(e, onEdit)}
          title="Edit staff"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-brand-600 hover:bg-white shadow-sm">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleAction(e, onDelete)}
          title="Delete staff"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-danger-600 hover:bg-white shadow-sm">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StaffModal({ member, classrooms, isOpen, onClose, onEdit, onDelete }) {
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
        <Button
          variant="secondary"
          icon={Trash2}
          onClick={() => {
            onClose();
            onDelete?.(member);
          }}>
          Delete
        </Button>
        <Button
          icon={Pencil}
          onClick={() => {
            onClose();
            onEdit?.(member);
          }}>
          Edit
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const { data: staff, loading: staffLoading } = useStaffData();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const openAdd = () => {
    setEditingStaff(null);
    setShowFormModal(true);
  };
  const openEdit = (member) => {
    setEditingStaff(member);
    setShowFormModal(true);
  };
  const closeForm = () => {
    setShowFormModal(false);
    setEditingStaff(null);
  };

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
      actions={
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="secondary"
            icon={UserPlus}
            onClick={() => setShowInviteModal(true)}>
            Invite teacher
          </Button>
          <Button icon={Plus} onClick={openAdd}>
            Add Staff
          </Button>
        </div>
      }
    >
      {/* Pending teacher invites (real-time, owner-only) */}
      <PendingInvites ownerUid={user?.uid} classrooms={classrooms} />

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

      {/* Mobile action buttons */}
      <div className="sm:hidden mb-4 flex flex-col gap-2">
        <Button icon={Plus} onClick={openAdd} className="w-full">
          Add Staff
        </Button>
        <Button
          variant="secondary"
          icon={UserPlus}
          onClick={() => setShowInviteModal(true)}
          className="w-full">
          Invite teacher to app
        </Button>
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
              onEdit={openEdit}
              onDelete={setDeletingStaff}
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
        onEdit={openEdit}
        onDelete={setDeletingStaff}
      />

      <StaffFormModal
        isOpen={showFormModal}
        onClose={closeForm}
        staffMember={editingStaff}
      />

      <ConfirmDialog
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={async () => {
          if (!deletingStaff) return;
          await staffApi.delete(deletingStaff.id);
        }}
        title="Delete staff member"
        message={
          deletingStaff
            ? `This will permanently delete ${deletingStaff.firstName} ${deletingStaff.lastName}. Activities they authored will remain in the logs but show as "unknown staff". This can't be undone.`
            : ''
        }
        confirmLabel="Delete staff"
      />

      {/* Invite Teacher Modal */}
      <InviteTeacherModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </Layout>
  );
}
