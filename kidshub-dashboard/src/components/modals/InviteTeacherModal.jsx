/**
 * InviteTeacherModal — owner-facing UI for issuing a teacher invite.
 *
 * Option B contract: the invite ALWAYS targets a pre-existing staff record.
 * Parent component (Staff.jsx per-card action) passes `staffMember`; this
 * modal reads the email + classroom off that record and only asks the owner
 * to confirm before generating the link.
 *
 * Two-stage UX:
 *   Stage 1 (confirm):  shows staff name/email/classroom + "Create invite"
 *   Stage 2 (result):   shows the generated invite URL with copy-to-clipboard
 *
 * On submit:
 *   1. invitesApi.create({ email, staffId, classroomId, classroomName,
 *      invitedBy, invitedByName, daycareId }) — writes invites/{token} +
 *      flips staff.appStatus to 'invited' (handled inside invitesApi).
 *   2. Display `${KIDSHUB_BASE_URL}/invite/{token}` for the owner to paste
 *      into an email/SMS/Slack DM.
 *
 * Email delivery is intentionally NOT wired here yet (no transactional email
 * provider in the MVP). Copy/paste is fine for pilot.
 *
 * Auth gating: the Firestore rule for invites/{token} create requires
 *   isOwner() && invitedBy == request.auth.uid && staffId is string
 * so this modal MUST be rendered inside ProtectedRoute (which already gates
 * the dashboard to owners).
 */
import { AlertTriangle, Check, Copy, ExternalLink, Send, UserPlus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../contexts';
import { invitesApi } from '../../firebase/api';
import { useClassroomsData } from '../../hooks';
import { Button, Modal, ModalFooter } from '../ui';

/**
 * Where the kidshub app lives. Read from Vite env at build time so the URL
 * follows the deploy environment. Falls back to localhost so local dev "just
 * works" without an env var.
 *
 * Production: set VITE_KIDSHUB_APP_URL=https://app.getkidshub.com in the
 * dashboard's Vercel project (or wherever it's deployed).
 */
const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5180'
).replace(/\/$/, '');

export function InviteTeacherModal({ isOpen, onClose, staffMember, onCreated }) {
  const { user, profile } = useAuth();
  const { data: classrooms } = useClassroomsData();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const inviterDisplayName = useMemo(() => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    }
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Your daycare';
  }, [profile, user]);

  const classroom = useMemo(() => {
    if (!staffMember?.classroom) return null;
    return classrooms?.find((c) => c.id === staffMember.classroom) || null;
  }, [staffMember, classrooms]);

  // Precondition checks — each maps to a specific UI message + disabled CTA.
  // Owners hit these when a staff record is missing an email or classroom
  // assignment; the modal explains the fix-up step rather than silently
  // failing at create-time.
  const blockers = useMemo(() => {
    const out = [];
    if (!staffMember) return out;
    if (!staffMember.email?.trim()) {
      out.push('This staff record has no email. Edit the staff member to add one first.');
    }
    if (!staffMember.classroom) {
      out.push('This staff record has no classroom assigned. Edit the staff member to pick one first.');
    }
    return out;
  }, [staffMember]);

  // Reset all state on every open. Without this, the modal would still show
  // a previously-created invite if the owner clicks a different staff card
  // right after closing.
  useEffect(() => {
    if (isOpen) {
      setError('');
      setCreatedInvite(null);
      setCopied(false);
      setSubmitting(false);
    }
  }, [isOpen, staffMember?.id]);

  const inviteUrl = createdInvite
    ? `${KIDSHUB_BASE_URL}/invite/${createdInvite.token}`
    : '';

  const handleSubmit = async () => {
    if (!staffMember || !user?.uid) return;
    if (blockers.length > 0) return;

    setSubmitting(true);
    setError('');
    try {
      const invite = await invitesApi.create({
        email: staffMember.email,
        staffId: staffMember.id,
        classroomId: staffMember.classroom,
        classroomName: classroom?.name || '',
        invitedBy: user.uid,
        invitedByName: inviterDisplayName,
      });
      setCreatedInvite(invite);
      onCreated?.(invite);
    } catch (err) {
      console.error('[InviteTeacherModal] failed to create invite:', err);
      setError(
        err?.code === 'permission-denied'
          ? "You don't have permission to send invites. Contact support if this looks wrong."
          : 'Could not create the invite. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[InviteTeacherModal] clipboard write failed:', err);
      setError('Could not copy to clipboard. Select the URL manually and copy.');
    }
  };

  const staffName = staffMember
    ? `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'this staff member'
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite to app" size="md">
      {createdInvite ? (
        <>
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-surface-900">
              Invite ready to share
            </h3>
            <p className="text-xs sm:text-sm text-surface-500 mt-1">
              Send this link to <span className="font-medium">{createdInvite.email}</span>.
              They&apos;ll set their own password and land in <span className="font-medium">
                {createdInvite.classroomName || 'their classroom'}
              </span>.
            </p>
          </div>

          <div className="bg-surface-50 border border-surface-200 rounded-xl p-3 sm:p-4 mb-3">
            <p className="text-xs uppercase tracking-wide text-surface-400 mb-1.5">
              Invite link
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs sm:text-sm text-surface-700 break-all select-all">
                {inviteUrl}
              </code>
              <a
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-surface-400 hover:text-surface-600 transition-colors"
                title="Open in new tab">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              icon={copied ? Check : Copy}
              onClick={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
              className={copied ? 'bg-success-100 text-success-700 hover:bg-success-200' : ''}>
              {copied ? 'Copied to clipboard' : 'Copy invite link'}
            </Button>
          </div>

          <p className="text-xs text-surface-400 mt-2">
            Link expires in 7 days. Revoke it from the Pending invites list anytime.
          </p>

          {error ? (
            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          ) : null}

          <ModalFooter>
            <Button onClick={onClose}>Done</Button>
          </ModalFooter>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
              <UserPlus className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-surface-700">
                You&apos;re giving <span className="font-medium">{staffName}</span> access to
                the KidsHub teacher app. They&apos;ll set their own password from the invite
                link.
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 divide-y divide-surface-100">
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="text-xs uppercase tracking-wide text-surface-400">
                  Email
                </div>
                <div className="text-sm text-surface-900 truncate">
                  {staffMember?.email || <span className="text-surface-400">—</span>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="text-xs uppercase tracking-wide text-surface-400">
                  Classroom
                </div>
                <div className="text-sm text-surface-900 flex items-center gap-2">
                  {classroom ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: classroom.color }}
                      />
                      {classroom.name}
                    </>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {blockers.length > 0 ? (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                  <ul className="text-xs sm:text-sm text-warning-800 space-y-1">
                    {blockers.map((msg) => <li key={msg}>{msg}</li>)}
                  </ul>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
                {error}
              </div>
            ) : null}
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={blockers.length > 0}
              icon={Send}>
              Create invite
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
