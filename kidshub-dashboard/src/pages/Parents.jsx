import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Baby,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Heart,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Layout } from '../components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  LoadingCards,
  Modal,
  ModalFooter,
  SearchInput,
  Select,
} from '../components/ui';
import { ParentFormModal, InviteParentModal } from '../components/modals';
import { useAuth } from '../contexts';
import { emailApi, invitesApi, parentsApi } from '../firebase/api';
import { useChildrenData, useParentsData } from '../hooks';

const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5180'
).replace(/\/$/, '');

/**
 * Parents page — direct mirror of Staff.jsx for the parent contact roster.
 * The owner adds parents (pre-user contact records), then clicks "Invite to
 * app" on a card to send an activation link. Linking siblings on a single
 * parent record means one invite covers all of them.
 *
 * Deep-link support: ?addFor={childId} opens the ParentFormModal in add
 * mode with that child pre-checked. Used by ChildProfile's "Invite parent"
 * button (we keep that affordance for discoverability, but it now routes
 * here instead of opening a modal in-place).
 */

/** Resolves a parent record's linked children to full child objects for display. */
function getLinkedChildren(parent, children) {
  const ids = Array.isArray(parent?.childIds)
    ? parent.childIds
    : Array.isArray(parent?.children)
      ? parent.children
      : [];
  return ids
    .map((id) => children?.find((c) => c.id === id))
    .filter(Boolean);
}

/**
 * Pending parent invites — real-time, owner-only. Filters
 * invitesApi.subscribeForOwner down to role='parent' and decorates each
 * row with the linked child name (looked up from useChildrenData). Same
 * shape as Staff.jsx's PendingInvites — extract to a shared component
 * if/when a third call site appears.
 */
function PendingParentInvites({ ownerUid, kids }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [resendState, setResendState] = useState({});

  useEffect(() => {
    if (!ownerUid) {
      setInvites([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = invitesApi.subscribeForOwner(ownerUid, (next) => {
      setInvites((next || []).filter((inv) => inv.role === 'parent'));
      setLoading(false);
    });
    return unsub;
  }, [ownerUid]);

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
      console.error('[PendingParentInvites] clipboard write failed:', err);
      window.prompt('Copy this invite link:', url);
    }
  };

  const handleResend = async (token) => {
    setResendState((prev) => ({ ...prev, [token]: { kind: 'sending' } }));
    try {
      await emailApi.sendInvite(token);
      setResendState((prev) => ({ ...prev, [token]: { kind: 'sent' } }));
      setTimeout(() => {
        setResendState((prev) => {
          const next = { ...prev };
          if (next[token]?.kind === 'sent') delete next[token];
          return next;
        });
      }, 2500);
    } catch (err) {
      console.error('[PendingParentInvites] resend failed:', err);
      setResendState((prev) => ({
        ...prev,
        [token]: { kind: 'error', message: err?.detail || err?.message || 'Resend failed' },
      }));
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
      console.error('[PendingParentInvites] delete failed:', err);
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
            Pending parent invites
          </h3>
          <Badge variant="info" className="ml-1">{invites.length}</Badge>
        </div>

        <div className="space-y-2">
          {invites.map((invite) => {
            const linkedChild = kids?.find((c) => c.id === invite.childId);
            const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : null;
            const isExpired = expiresAt && expiresAt.getTime() < Date.now();
            const isCopied = copiedToken === invite.token;
            const isRevoking = revoking === invite.token;
            const resend = resendState[invite.token];
            const isSending = resend?.kind === 'sending';
            const justSent = resend?.kind === 'sent';
            const resendError = resend?.kind === 'error' ? resend.message : '';
            // siblingCount is the EXTRA children beyond the primary —
            // pulled off invite.childIds (denormalized at create time).
            const siblingCount = Array.isArray(invite.childIds)
              ? Math.max(0, invite.childIds.length - 1)
              : 0;

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
                    {justSent ? (
                      <Badge variant="success" className="text-xs">Email sent</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-surface-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Baby className="w-3 h-3" />
                      {linkedChild
                        ? `${linkedChild.firstName || ''} ${linkedChild.lastName || ''}`.trim()
                        : invite.childName || 'Unknown child'}
                      {siblingCount > 0
                        ? ` +${siblingCount} ${siblingCount === 1 ? 'sibling' : 'siblings'}`
                        : ''}
                    </span>
                    {expiresAt ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                  {resendError ? (
                    <p className="mt-1 text-xs text-warning-700 break-words">
                      Resend failed: {resendError}
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2 sm:gap-2 self-stretch sm:self-auto">
                  <Button
                    variant="secondary"
                    icon={isSending ? Clock : Mail}
                    onClick={() => handleResend(invite.token)}
                    disabled={isSending || isExpired}
                    title={
                      isExpired
                        ? 'Invite expired — revoke and create a new one'
                        : 'Resend the activation email to this address'
                    }
                    className="text-xs sm:text-sm">
                    {isSending ? 'Sending…' : 'Resend email'}
                  </Button>
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

function ParentCard({ parent, kids, onClick, onEdit, onDelete, onInvite }) {
  const linkedChildren = useMemo(
    () => getLinkedChildren(parent, kids),
    [parent, kids]
  );
  const appStatus = parent.appStatus || 'none';

  const handleAction = (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.(parent);
  };

  // Mirror of StaffCard: surface specific blockers under the disabled
  // "Invite to app" button so owners don't have to hover for a tooltip.
  const missingForInvite = [];
  if (!parent.email?.trim()) missingForInvite.push('email');
  if (linkedChildren.length === 0) missingForInvite.push('a linked child');
  const disableInvite = missingForInvite.length > 0;

  const fullName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'Parent';

  return (
    <div className="relative group">
      <Card hover className="cursor-pointer" onClick={() => onClick(parent)}>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar name={fullName} size="xl" />

            <h3 className="font-semibold text-surface-900 mt-3 text-sm sm:text-base">
              {fullName}
            </h3>
            {parent.relationship ? (
              <p className="text-xs sm:text-sm text-brand-600 font-medium">
                {parent.relationship}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-1 sm:gap-1.5 justify-center">
              {linkedChildren.length === 0 ? (
                <Badge variant="neutral" className="text-xs">No children linked</Badge>
              ) : (
                <>
                  {linkedChildren.slice(0, 2).map((c) => (
                    <Badge key={c.id} variant="info" className="text-xs">
                      {c.firstName} {c.lastName}
                    </Badge>
                  ))}
                  {linkedChildren.length > 2 ? (
                    <Badge variant="neutral" className="text-xs">
                      +{linkedChildren.length - 2}
                    </Badge>
                  ) : null}
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1 justify-center">
              {parent.emergencyContact ? (
                <Badge variant="danger" className="text-xs">Emergency</Badge>
              ) : null}
              {parent.authorizedPickup !== false ? (
                <Badge variant="success" className="text-xs">Pickup</Badge>
              ) : null}
            </div>

            {/* App-access row — always visible so every card is self-explanatory. */}
            <div className="mt-3 sm:mt-4 w-full">
              {appStatus === 'active' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 text-success-700 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  App access
                </div>
              ) : appStatus === 'invited' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-50 text-warning-700 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Invite pending
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleAction(e, onInvite)}
                    disabled={disableInvite}
                    title={
                      disableInvite
                        ? `Add ${missingForInvite.join(' and ')} first to enable invite`
                        : 'Invite this parent to the KidsHub app'
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite to app
                  </button>
                  {disableInvite ? (
                    <p className="mt-1.5 text-[11px] text-surface-400 leading-snug">
                      Add {missingForInvite.join(' and ')} to enable
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => handleAction(e, onEdit)}
          title="Edit parent"
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-brand-600 hover:bg-white shadow-sm">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleAction(e, onDelete)}
          title={
            appStatus === 'active'
              ? 'Revoke app access first to delete'
              : 'Delete parent'
          }
          disabled={appStatus === 'active'}
          className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-surface-500 hover:text-danger-600 hover:bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-surface-500 disabled:hover:bg-white/90">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ParentDetailModal({ parent, kids, isOpen, onClose, onEdit, onDelete }) {
  if (!parent) return null;

  const linkedChildren = getLinkedChildren(parent, kids);
  const fullName =
    `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'Parent';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Parent Details" size="md">
      <div className="text-center mb-4 sm:mb-6">
        <Avatar name={fullName} size="2xl" className="mx-auto mb-3 sm:mb-4" />
        <h2 className="text-lg sm:text-xl font-bold text-surface-900">{fullName}</h2>
        {parent.relationship ? (
          <p className="text-brand-600 font-medium text-sm sm:text-base">
            {parent.relationship}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {parent.email ? (
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <Mail className="w-5 h-5 text-surface-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-surface-400">Email</p>
              <a
                href={`mailto:${parent.email}`}
                className="text-sm text-brand-600 hover:underline truncate block">
                {parent.email}
              </a>
            </div>
          </div>
        ) : null}

        {parent.phone ? (
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <Phone className="w-5 h-5 text-surface-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-surface-400">Phone</p>
              <a
                href={`tel:${parent.phone}`}
                className="text-sm text-brand-600 hover:underline">
                {parent.phone}
              </a>
            </div>
          </div>
        ) : null}

        <div className="p-3 bg-surface-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Baby className="w-5 h-5 text-surface-400" />
            <p className="text-xs text-surface-400">Linked children</p>
          </div>
          {linkedChildren.length === 0 ? (
            <p className="text-sm text-surface-500">
              Not linked to any children yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {linkedChildren.map((c) => (
                <Badge key={c.id} variant="info">
                  {c.firstName} {c.lastName}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {parent.emergencyContact ? (
            <div className="flex-1 flex items-center gap-2 p-3 bg-danger-50 rounded-xl">
              <Shield className="w-5 h-5 text-danger-500 flex-shrink-0" />
              <p className="text-xs text-danger-700 font-medium">
                Emergency contact
              </p>
            </div>
          ) : null}
          {parent.authorizedPickup !== false ? (
            <div className="flex-1 flex items-center gap-2 p-3 bg-success-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
              <p className="text-xs text-success-700 font-medium">
                Authorized pickup
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button
          variant="secondary"
          icon={Trash2}
          disabled={parent.appStatus === 'active'}
          title={
            parent.appStatus === 'active'
              ? 'Revoke app access first to delete'
              : 'Delete parent'
          }
          onClick={() => {
            onClose();
            onDelete?.(parent);
          }}>
          Delete
        </Button>
        <Button
          icon={Pencil}
          onClick={() => {
            onClose();
            onEdit?.(parent);
          }}>
          Edit
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default function Parents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: parents, loading: parentsLoading } = useParentsData();
  const { data: children, loading: childrenLoading } = useChildrenData();

  const [searchQuery, setSearchQuery] = useState('');
  const [childFilter, setChildFilter] = useState('all');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deletingParent, setDeletingParent] = useState(null);
  const [invitingParent, setInvitingParent] = useState(null);
  // ChildProfile deep-link target — when set, the form opens in add mode
  // with this child pre-checked. Cleared after the form opens so the URL
  // param can be consumed once and not retrigger on subsequent renders.
  const [preselectedChildId, setPreselectedChildId] = useState(null);

  // Consume the ?addFor={childId} deep-link from ChildProfile (or any
  // future caller). We stash it locally, open the modal, then strip the
  // query param so a refresh / back-navigation doesn't reopen the modal.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const addFor = params.get('addFor');
    if (!addFor) return;
    setPreselectedChildId(addFor);
    setEditingParent(null);
    setShowFormModal(true);
    // Strip the param. Use replace so the back stack stays clean.
    params.delete('addFor');
    const cleaned = params.toString();
    navigate(
      { pathname: location.pathname, search: cleaned ? `?${cleaned}` : '' },
      { replace: true }
    );
    // Intentionally only depend on location.search — re-running on every
    // navigate() call would trigger an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const openAdd = () => {
    setEditingParent(null);
    setPreselectedChildId(null);
    setShowFormModal(true);
  };
  const openEdit = (p) => {
    setEditingParent(p);
    setPreselectedChildId(null);
    setShowFormModal(true);
  };
  const closeForm = () => {
    setShowFormModal(false);
    setEditingParent(null);
    setPreselectedChildId(null);
  };

  const loading = parentsLoading || childrenLoading;

  const childOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All children' }];
    (children || [])
      .slice()
      .sort((a, b) => {
        const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
        const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
        return aName.localeCompare(bName);
      })
      .forEach((c) => {
        opts.push({ value: c.id, label: `${c.firstName} ${c.lastName}` });
      });
    return opts;
  }, [children]);

  const filteredParents = (parents || []).filter((p) => {
    const matchesSearch = `${p.firstName || ''} ${p.lastName || ''} ${p.email || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesChild =
      childFilter === 'all' ||
      (Array.isArray(p.childIds) && p.childIds.includes(childFilter)) ||
      (Array.isArray(p.children) && p.children.includes(childFilter));
    return matchesSearch && matchesChild;
  });

  const activeCount = parents?.filter((p) => p.appStatus === 'active').length || 0;
  const invitedCount = parents?.filter((p) => p.appStatus === 'invited').length || 0;

  if (loading) {
    return (
      <Layout title="Parents" subtitle="Loading...">
        <LoadingCards count={6} />
      </Layout>
    );
  }

  return (
    <Layout
      title="Parents"
      subtitle={`${parents?.length || 0} parent ${
        parents?.length === 1 ? 'contact' : 'contacts'
      }`}
      actions={
        <div className="hidden sm:flex items-center gap-2">
          <Button icon={Plus} onClick={openAdd}>
            Add Parent
          </Button>
        </div>
      }>
      {/* Pending parent invites (real-time, owner-only) */}
      <PendingParentInvites ownerUid={user?.uid} kids={children} />

      {/* Status Summary */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-success-50 text-success-700 rounded-lg sm:rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">{activeCount} App access</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-warning-50 text-warning-700 rounded-lg sm:rounded-xl">
          <Clock className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">{invitedCount} Invite pending</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardBody className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={childOptions}
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="w-full sm:w-56"
            />
          </div>
        </CardBody>
      </Card>

      {/* Mobile add button */}
      <div className="sm:hidden mb-4">
        <Button icon={Plus} onClick={openAdd} className="w-full">
          Add Parent
        </Button>
      </div>

      {/* Parents Grid */}
      {filteredParents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredParents.map((p) => (
            <ParentCard
              key={p.id}
              parent={p}
              kids={children}
              onClick={setSelectedParent}
              onEdit={openEdit}
              onDelete={setDeletingParent}
              onInvite={setInvitingParent}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={parents?.length === 0 ? Heart : Users}
              title={
                parents?.length === 0
                  ? 'No parents on the roster yet'
                  : 'No parents match those filters'
              }
              description={
                parents?.length === 0
                  ? 'Add a parent contact to start. You can link them to children and invite them to the KidsHub app.'
                  : 'Try clearing the search or child filter.'
              }
              action={parents?.length === 0 ? openAdd : undefined}
              actionLabel={parents?.length === 0 ? 'Add your first parent' : undefined}
            />
          </CardBody>
        </Card>
      )}

      {/* Detail Modal */}
      <ParentDetailModal
        parent={selectedParent}
        kids={children}
        isOpen={!!selectedParent}
        onClose={() => setSelectedParent(null)}
        onEdit={openEdit}
        onDelete={setDeletingParent}
      />

      {/* Form Modal (add + edit) */}
      <ParentFormModal
        isOpen={showFormModal}
        onClose={closeForm}
        parent={editingParent}
        preselectedChildId={preselectedChildId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingParent}
        onClose={() => setDeletingParent(null)}
        onConfirm={async () => {
          if (!deletingParent || deletingParent.appStatus === 'active') return;
          await parentsApi.delete(deletingParent.id);
        }}
        title="Delete parent"
        blocked={deletingParent?.appStatus === 'active'}
        blockedReason={
          deletingParent?.appStatus === 'active'
            ? `${deletingParent.firstName} ${deletingParent.lastName} currently has active app access. Remove their parent account in Firebase Auth (or wait for a "Revoke access" action — coming soon) before deleting this parent record.`
            : undefined
        }
        message={
          deletingParent && deletingParent.appStatus !== 'active'
            ? `This will permanently delete ${deletingParent.firstName} ${deletingParent.lastName} from your parent roster. Their pending invite (if any) will also be revoked. This can't be undone.`
            : ''
        }
        confirmLabel="Delete parent"
      />

      {/* Invite Modal — Option B path, always targets a specific parent record */}
      <InviteParentModal
        isOpen={!!invitingParent}
        onClose={() => setInvitingParent(null)}
        parent={invitingParent}
      />
    </Layout>
  );
}
