import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  AlertTriangle,
  Heart,
  Utensils,
  Moon,
  Baby,
  Smile,
  Camera,
  FileText,
  MessageSquare,
  Edit,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Clock,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Badge,
  StatusBadge,
  Button,
  LoadingPage,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import { ActivityIcon, activityLabels } from '../components/icons/ActivityIcons';
import { useChild, useClassroom, useChildActivities, useParentsData, useStaffData } from '../hooks';
import { activitiesApi, childrenApi, emailApi, invitesApi, usersApi } from '../firebase/api';
import { ChildFormModal } from '../components/modals';

/**
 * Same VITE_KIDSHUB_APP_URL as InviteParentModal — kept as a local constant
 * to avoid depending on the modal's internal export (which would pull in
 * its entire React tree just for a URL).
 */
const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5180'
).replace(/\/$/, '');

/**
 * Inline pending parent invite row — shown in the Contacts tab.
 * Duplicates Staff.jsx's PendingInviteRow at a smaller scale; extract to
 * a shared component if/when a third call site appears.
 */
function PendingParentInviteRow({ invite, onCopy, onRevoke, copiedToken }) {
  const expiresMs = invite.expiresAt?.toMillis?.();
  const expired = typeof expiresMs === 'number' && expiresMs < Date.now();
  const inviteUrl = `${KIDSHUB_BASE_URL}/invite/${invite.token}`;
  const copied = copiedToken === invite.token;

  // Local resend state — inline instead of lifted because only this row
  // ever shows it. 'sending' | 'sent' | 'error:<msg>' | null.
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      await emailApi.sendInvite(invite.token);
      setResendStatus({ kind: 'sent' });
      setTimeout(() => {
        setResendStatus((prev) => (prev?.kind === 'sent' ? null : prev));
      }, 2500);
    } catch (err) {
      console.error('[PendingParentInviteRow] resend failed:', err);
      setResendStatus({
        kind: 'error',
        message: err?.detail || err?.message || 'Resend failed',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-surface-50 rounded-xl">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Mail className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          <span className="text-sm font-medium text-surface-800 truncate">{invite.email}</span>
          {expired ? (
            <Badge variant="danger">Expired</Badge>
          ) : (
            <Badge variant="neutral">
              <Clock className="w-3 h-3" />
              Pending
            </Badge>
          )}
          {resendStatus?.kind === 'sent' ? (
            <Badge variant="success">Email sent</Badge>
          ) : null}
        </div>
        <code className="block mt-1 text-xs text-surface-500 break-all truncate">{inviteUrl}</code>
        {resendStatus?.kind === 'error' ? (
          <p className="mt-1 text-xs text-warning-700 break-words">
            Resend failed: {resendStatus.message}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          icon={resending ? Clock : Mail}
          onClick={handleResend}
          disabled={resending || expired}
          title={
            expired
              ? 'Invite expired — revoke and create a new one'
              : 'Resend the activation email to this parent'
          }>
          {resending ? 'Sending…' : 'Resend'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={copied ? Check : Copy}
          onClick={() => onCopy(inviteUrl, invite.token)}
          className={copied ? 'bg-success-100 text-success-700 hover:bg-success-200' : ''}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button size="sm" variant="secondary" icon={Trash2} onClick={() => onRevoke(invite)}>
          Revoke
        </Button>
      </div>
    </div>
  );
}

const quickLogActions = [
  { type: 'meal', icon: Utensils, label: 'Meal', color: 'bg-warning-100 text-warning-600' },
  { type: 'nap', icon: Moon, label: 'Nap', color: 'bg-info-100 text-info-600' },
  { type: 'diaper', icon: Baby, label: 'Diaper', color: 'bg-accent-100 text-accent-600' },
  { type: 'mood', icon: Smile, label: 'Mood', color: 'bg-brand-100 text-brand-600' },
  { type: 'photo', icon: Camera, label: 'Photo', color: 'bg-success-100 text-success-600' },
  { type: 'note', icon: FileText, label: 'Note', color: 'bg-surface-100 text-surface-600' },
];

function TimelineItem({ activity, staff }) {
  const staffMember = staff?.find(s => s.id === activity.staffId);
  const label = activityLabels[activity.type] || activity.type;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <ActivityIcon type={activity.type} size="md" />
        <div className="w-0.5 h-full bg-surface-100 my-2" />
      </div>
      <div className="flex-1 pb-4 sm:pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-surface-900 text-sm sm:text-base">{label}</p>
            <p className="text-xs sm:text-sm text-surface-600 mt-0.5 line-clamp-2">{activity.notes}</p>
            <p className="text-xs text-surface-400 mt-1">
              {staffMember?.firstName} {staffMember?.lastName}
            </p>
          </div>
          <div className="text-right text-xs text-surface-400 whitespace-nowrap flex-shrink-0">
            <p>{formatTime(activity.timestamp)}</p>
            <p className="text-surface-300">{formatDate(activity.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChildProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: child, loading: childLoading } = useChild(id);
  const { data: classroom } = useClassroom(child?.classroom);
  const { data: activities, loading: activitiesLoading } = useChildActivities(id);
  const { data: parents } = useParentsData();
  const { data: staff } = useStaffData();
  const [activeTab, setActiveTab] = useState('timeline');
  const [pendingParentInvites, setPendingParentInvites] = useState([]);
  const [copiedInviteToken, setCopiedInviteToken] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkedParentUsers, setLinkedParentUsers] = useState([]);
  const [loadingLinkedParents, setLoadingLinkedParents] = useState(false);
  const [confirmUnlinkParent, setConfirmUnlinkParent] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    const unsub = invitesApi.subscribeForChild(id, setPendingParentInvites);
    return () => unsub?.();
  }, [id]);

  // Resolve users/{uid} docs for each linked parent (child.parentIds).
  // We don't subscribe since parent profile changes are rare; a one-shot
  // fetch on mount + whenever the list of linked UIDs changes is enough,
  // and avoids extra listeners for each parent.
  useEffect(() => {
    const uids = Array.isArray(child?.parentIds) ? child.parentIds : [];
    if (!child || uids.length === 0) {
      setLinkedParentUsers([]);
      return;
    }
    let cancelled = false;
    setLoadingLinkedParents(true);
    Promise.all(uids.map((uid) => usersApi.getById(uid).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        setLinkedParentUsers(results.filter(Boolean));
      })
      .finally(() => {
        if (!cancelled) setLoadingLinkedParents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [child?.id, child?.parentIds?.join('|')]);

  const performUnlinkParent = async (parent) => {
    if (!parent?.id || !id) return;
    await usersApi.unlinkParentFromChild(parent.id, id);
    setLinkedParentUsers((prev) => prev.filter((p) => p.id !== parent.id));
  };

  const handleCopyInvite = async (url, token) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteToken(token);
      setTimeout(() => setCopiedInviteToken(''), 2000);
    } catch (err) {
      console.error('[ChildProfile] clipboard write failed:', err);
    }
  };

  const handleRevokeInvite = async (invite) => {
    if (!invite?.token) return;
    if (!window.confirm(`Revoke the invite for ${invite.email}?`)) return;
    try {
      await invitesApi.delete(invite.token);
    } catch (err) {
      console.error('[ChildProfile] failed to revoke invite:', err);
      window.alert('Could not revoke the invite. Please try again.');
    }
  };

  const handleQuickLog = async (type) => {
    try {
      await activitiesApi.create({
        childId: id,
        type,
        staffId: 'staff-1',
        notes: `${activityLabels[type] || type} logged`,
        details: {},
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  if (childLoading) {
    return (
      <Layout title="Loading...">
        <LoadingPage message="Loading child profile..." />
      </Layout>
    );
  }

  if (!child) {
    return (
      <Layout title="Child Not Found">
        <Card>
          <CardBody>
            <EmptyState
              icon={Baby}
              title="Child not found"
              description="The child you're looking for doesn't exist."
              action={() => window.history.back()}
              actionLabel="Go Back"
            />
          </CardBody>
        </Card>
      </Layout>
    );
  }

  const parentContacts = child.parents?.map((parentId) =>
    parents?.find(p => p.id === parentId)
  ).filter(Boolean) || [];

  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'info', label: 'Info' },
    { id: 'contacts', label: 'Contacts' },
  ];

  // Dependency checks for delete — consistent with the "block_with_deps"
  // policy. Owner must explicitly unlink parents before we wipe the child
  // (activities + messages are cascaded automatically since they're logs).
  const linkedParentCount =
    (Array.isArray(child.parentIds) ? child.parentIds.length : 0) ||
    (Array.isArray(child.parents) ? child.parents.length : 0);
  const pendingInviteCount = pendingParentInvites.length;

  let deleteBlockedReason = null;
  if (linkedParentCount > 0 || pendingInviteCount > 0) {
    const parts = [];
    if (linkedParentCount > 0) {
      parts.push(
        `${linkedParentCount} linked ${linkedParentCount === 1 ? 'parent' : 'parents'}`
      );
    }
    if (pendingInviteCount > 0) {
      parts.push(
        `${pendingInviteCount} pending ${pendingInviteCount === 1 ? 'invite' : 'invites'}`
      );
    }
    deleteBlockedReason = `This child still has ${parts.join(' and ')}. Unlink parents and revoke pending invites from the Contacts tab first.`;
  }

  return (
    <Layout
      title={
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/children"
            className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <span className="text-base sm:text-xl truncate">{child.firstName} {child.lastName}</span>
        </div>
      }
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" icon={MessageSquare} className="hidden sm:inline-flex">
            Message Parents
          </Button>
          <Button
            variant="secondary"
            icon={Edit}
            onClick={() => setEditOpen(true)}
            className="hidden sm:inline-flex">
            Edit
          </Button>
          <Button
            variant="secondary"
            icon={Trash2}
            onClick={() => setDeleteOpen(true)}
            className="hidden sm:inline-flex">
            Delete
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card>
            <CardBody className="text-center p-4 sm:p-5">
              <Avatar
                name={`${child.firstName} ${child.lastName}`}
                size="2xl"
                className="mx-auto mb-3 sm:mb-4"
              />
              <h2 className="text-lg sm:text-xl font-bold text-surface-900">
                {child.firstName} {child.lastName}
              </h2>
              <p className="text-surface-500 text-sm sm:text-base">{child.age}</p>

              <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: classroom?.color }}
                />
                <span className="text-sm text-surface-600">{classroom?.name}</span>
              </div>

              <div className="mt-3 sm:mt-4">
                <StatusBadge status={child.status} />
              </div>

              {/* Allergies & Conditions */}
              {((child.allergies?.length > 0) || (child.medicalConditions?.length > 0)) && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-surface-100">
                  {child.allergies?.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-surface-700 mb-2">
                        Allergies
                      </h4>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {child.allergies.map((allergy) => (
                          <Badge key={allergy} variant="danger">
                            <AlertTriangle className="w-3 h-3" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {child.medicalConditions?.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-surface-700 mb-2">
                        Medical Conditions
                      </h4>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {child.medicalConditions.map((condition) => (
                          <Badge key={condition} variant="warning">
                            <Heart className="w-3 h-3" />
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Special Instructions */}
          {child.specialInstructions && (
            <Card className="border-warning-200 bg-warning-50">
              <CardBody className="p-3 sm:p-5">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-warning-800 text-sm sm:text-base">Special Instructions</h4>
                    <p className="text-xs sm:text-sm text-warning-700 mt-1">{child.specialInstructions}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick Log Actions */}
          <Card>
            <CardHeader className="px-3 sm:px-5 py-3 sm:py-4">
              <h3 className="font-semibold text-surface-900 text-sm sm:text-base">Quick Log</h3>
            </CardHeader>
            <CardBody className="p-3 sm:p-5 pt-0 sm:pt-0">
              <div className="grid grid-cols-3 gap-2">
                {quickLogActions.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => handleQuickLog(action.type)}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xs font-medium text-surface-600">{action.label}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Mobile Actions */}
          <div className="sm:hidden grid grid-cols-3 gap-2">
            <Button variant="secondary" icon={MessageSquare} className="text-sm">
              Message
            </Button>
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => setEditOpen(true)}
              className="text-sm">
              Edit
            </Button>
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
              className="text-sm">
              Delete
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            {/* Tabs */}
            <div className="border-b border-surface-100 overflow-x-auto">
              <div className="flex px-3 sm:px-5 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <CardBody className="p-3 sm:p-5">
              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div>
                  {activitiesLoading ? (
                    <div className="text-center py-8 text-surface-500">
                      Loading activities...
                    </div>
                  ) : activities?.length > 0 ? (
                    activities.map((activity) => (
                      <TimelineItem key={activity.id} activity={activity} staff={staff} />
                    ))
                  ) : (
                    <EmptyState
                      title="No activities yet"
                      description="Start logging activities using the Quick Log buttons"
                    />
                  )}
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-surface-500 uppercase tracking-wide mb-2 sm:mb-3">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-surface-400">Date of Birth</p>
                        <p className="font-medium text-surface-900 text-sm sm:text-base">
                          {new Date(child.dateOfBirth).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Gender</p>
                        <p className="font-medium text-surface-900 text-sm sm:text-base">{child.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Enrollment Date</p>
                        <p className="font-medium text-surface-900 text-sm sm:text-base">
                          {new Date(child.enrollmentDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Classroom</p>
                        <p className="font-medium text-surface-900 text-sm sm:text-base">{classroom?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-surface-500 uppercase tracking-wide mb-2 sm:mb-3">
                      Weekly Schedule
                    </h4>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {child.schedule && Object.entries(child.schedule).map(([day, enrolled]) => (
                        <div
                          key={day}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                            enrolled
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-surface-100 text-surface-400'
                          }`}
                        >
                          {day.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>

                  {child.dietaryRestrictions?.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-surface-500 uppercase tracking-wide mb-2 sm:mb-3">
                        Dietary Restrictions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {child.dietaryRestrictions.map((restriction) => (
                          <Badge key={restriction} variant="neutral">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contacts Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900">Parent app access</h4>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Send a link — the parent sets up their own KidsHub account.
                      </p>
                    </div>
                    <Button
                      icon={UserPlus}
                      onClick={() => navigate(`/parents?addFor=${child.id}`)}
                      title="Open the Parents page to add a new parent contact, pre-linked to this child">
                      Invite parent to app
                    </Button>
                  </div>

                  {pendingParentInvites.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-surface-400">
                        Pending invites
                      </p>
                      {pendingParentInvites.map((invite) => (
                        <PendingParentInviteRow
                          key={invite.token}
                          invite={invite}
                          onCopy={handleCopyInvite}
                          onRevoke={handleRevokeInvite}
                          copiedToken={copiedInviteToken}
                        />
                      ))}
                    </div>
                  )}

                  {/* App-linked parents: users who have signed up and can see
                      this child in the KidsHub app. Unlinking here removes the
                      child from their childIds and this UID from the child's
                      parentIds (see usersApi.unlinkParentFromChild). */}
                  {(linkedParentUsers.length > 0 || loadingLinkedParents) && (
                    <div className="space-y-2 pt-2 border-t border-surface-100">
                      <p className="text-xs font-medium uppercase tracking-wide text-surface-400">
                        App-linked parents
                      </p>
                      {loadingLinkedParents && linkedParentUsers.length === 0 ? (
                        <p className="text-sm text-surface-500">Loading linked parents…</p>
                      ) : (
                        linkedParentUsers.map((parent) => (
                          <div
                            key={parent.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-surface-50 rounded-xl">
                            <div className="min-w-0 flex-1 flex items-center gap-3">
                              <Avatar
                                name={
                                  parent.firstName || parent.lastName
                                    ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim()
                                    : (parent.email || 'P')
                                }
                                size="md"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-surface-900 truncate">
                                  {parent.firstName || parent.lastName
                                    ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim()
                                    : 'Parent'}
                                </p>
                                {parent.email ? (
                                  <p className="text-xs text-surface-500 truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    {parent.email}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Trash2}
                              onClick={() => setConfirmUnlinkParent(parent)}>
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-surface-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-2">
                      Contacts on file
                    </p>
                  </div>

                  {parentContacts.length > 0 ? (
                    parentContacts.map((parent) => (
                      <div
                        key={parent.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-surface-50 rounded-xl gap-3 sm:gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Avatar name={`${parent.firstName} ${parent.lastName}`} size="lg" />
                          <div>
                            <p className="font-medium text-surface-900 text-sm sm:text-base">
                              {parent.firstName} {parent.lastName}
                            </p>
                            <p className="text-xs sm:text-sm text-surface-500">{parent.relationship}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                              <a
                                href={`tel:${parent.phone}`}
                                className="text-xs sm:text-sm text-brand-600 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {parent.phone}
                              </a>
                              <a
                                href={`mailto:${parent.email}`}
                                className="text-xs sm:text-sm text-brand-600 hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px] sm:max-w-none">{parent.email}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 sm:flex-col sm:items-end">
                          {parent.emergencyContact && (
                            <Badge variant="danger">Emergency</Badge>
                          )}
                          {parent.authorizedPickup && (
                            <Badge variant="success">Pickup</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No contacts"
                      description="No parent contacts found for this child"
                    />
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <ChildFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        child={child}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await childrenApi.deleteWithDependents(child.id);
          // Navigate away — the child is gone and the detail view would
          // show "Not found" otherwise.
          window.location.assign('/children');
        }}
        title="Delete child"
        message={`This will permanently delete ${child.firstName} ${child.lastName} along with their activity log and messages. This can't be undone.`}
        confirmLabel="Delete child"
        blocked={!!deleteBlockedReason}
        blockedReason={deleteBlockedReason}
      />

      <ConfirmDialog
        isOpen={!!confirmUnlinkParent}
        onClose={() => setConfirmUnlinkParent(null)}
        onConfirm={async () => {
          await performUnlinkParent(confirmUnlinkParent);
        }}
        title="Remove parent access"
        message={
          confirmUnlinkParent
            ? `${
                confirmUnlinkParent.firstName || confirmUnlinkParent.email || 'This parent'
              } will lose access to ${child.firstName}'s profile in the KidsHub app. Their own account is kept — you can re-link them any time by sending a new invite.`
            : ''
        }
        confirmLabel="Remove access"
      />
    </Layout>
  );
}
