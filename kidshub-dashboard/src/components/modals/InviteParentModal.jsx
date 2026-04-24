/**
 * InviteParentModal — owner-facing UI for issuing a parent invite.
 *
 * Two call sites, two prop shapes — pick ONE:
 *
 *   1) Option B (preferred): pass `parent` (a parents/{id} record). Email
 *      is locked to the record's email, primary childId is the first id
 *      in parent.childIds, parentId is sent so the accept flow links ALL
 *      siblings on the record. This is what the Parents page uses.
 *
 *   2) Legacy: pass `child` (a children/{id} record). Email is collected
 *      from the form, only that one child is linked, no parents/{id}
 *      record is involved. This is what ChildProfile USED to use; after
 *      Step 6's rewire ChildProfile deep-links to /parents instead, but
 *      we keep this branch alive for any other call site that still uses
 *      the per-child invite shape.
 *
 * Two-stage UX (same for both paths):
 *   Stage 1 (form):    confirm details + "Create invite"
 *   Stage 2 (result):  generated invite URL with copy-to-clipboard
 *
 * Security: the Firestore rule for invites/{token} create with role='parent'
 * requires:
 *   - isOwner()
 *   - invitedBy == request.auth.uid
 *   - daycareId == request.auth.uid
 *   - childId is a string
 * (parentId optional — see invites rule comment.) This modal is rendered
 * inside ProtectedRoute (owner-gated), and we pass invitedBy + daycareId
 * through invitesApi from user.uid.
 */
import { AlertTriangle, Check, Copy, ExternalLink, Mail, Send, Heart, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../contexts';
import { emailApi, invitesApi } from '../../firebase/api';
import { useChildrenData } from '../../hooks';
import { Button, Input, Modal, ModalFooter } from '../ui';

/**
 * Where the kidshub app lives. Same env var as InviteTeacherModal —
 * keep in sync if you add more deploy targets.
 */
const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5180'
).replace(/\/$/, '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = { email: '' };

export function InviteParentModal({ isOpen, onClose, onCreated, parent, child }) {
  const { user, profile } = useAuth();
  // Used in the parent-prop path to render sibling names in the confirm
  // screen ("This will connect Alex Smith and 2 siblings"). Cheap to pull
  // for the legacy child-prop path too — useChildrenData is already
  // subscribed elsewhere on the dashboard.
  const { data: children } = useChildrenData();

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);
  const [resendError, setResendError] = useState('');

  // Mode select — parent-prop wins if both are passed. We don't crash on
  // both because Staff page only passes one and ChildProfile only passes
  // one, but if a future caller is sloppy, parent-prop is the one with
  // sibling support so it's the safer default.
  const mode = parent ? 'parent' : 'child';

  const inviterDisplayName = useMemo(() => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    }
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Your daycare';
  }, [profile, user]);

  // Resolve children linked to this invite. Parent path: the parent
  // record's childIds[] (with legacy `children` field fallback). Child
  // path: just the single child. We hydrate names from useChildrenData
  // so we don't have to re-fetch per-child.
  const linkedChildren = useMemo(() => {
    if (mode === 'parent') {
      const ids = Array.isArray(parent?.childIds)
        ? parent.childIds
        : Array.isArray(parent?.children)
          ? parent.children
          : [];
      return ids
        .map((id) => children?.find((c) => c.id === id))
        .filter(Boolean);
    }
    return child ? [child] : [];
  }, [mode, parent, child, children]);

  // Primary child for the invite payload. Parent path: first linked child
  // by name (alphabetical, matches form modal order). Child path: the
  // passed-in child. The accept flow uses this for the welcome banner;
  // the rest of the linked children get attached via invite.childIds[].
  const primaryChild = useMemo(() => {
    if (mode === 'parent') {
      const sorted = [...linkedChildren].sort((a, b) => {
        const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
        const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
        return aName.localeCompare(bName);
      });
      return sorted[0] || null;
    }
    return child || null;
  }, [mode, linkedChildren, child]);

  const primaryChildName = useMemo(() => {
    if (!primaryChild) return '';
    return `${primaryChild.firstName ?? ''} ${primaryChild.lastName ?? ''}`.trim();
  }, [primaryChild]);

  // Email source: locked to parent record in parent-mode, free-text in
  // child-mode. Reset on every open so a previous form value doesn't
  // leak into a different invite.
  useEffect(() => {
    if (isOpen) {
      setForm(mode === 'parent' ? { email: parent?.email || '' } : EMPTY_FORM);
      setError('');
      setCreatedInvite(null);
      setCopied(false);
      setSubmitting(false);
      setResending(false);
      setResendResult(null);
      setResendError('');
    }
  }, [isOpen, mode, parent?.email]);

  const inviteUrl = createdInvite
    ? `${KIDSHUB_BASE_URL}/invite/${createdInvite.token}`
    : '';

  // Parent-mode preconditions — surfaced in-dialog so owners don't have
  // to guess why "Create invite" is disabled. Mirror of InviteTeacherModal's
  // blockers logic.
  const blockers = useMemo(() => {
    if (mode !== 'parent') return [];
    const out = [];
    if (!parent) return out;
    if (!parent.email?.trim()) {
      out.push('This parent record has no email. Edit the parent to add one first.');
    }
    if (linkedChildren.length === 0) {
      out.push('This parent isn’t linked to any children yet. Edit the parent to pick at least one.');
    }
    return out;
  }, [mode, parent, linkedChildren]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!user?.uid) return 'You must be signed in to send invites.';
    if (mode === 'parent') {
      if (!parent?.id) return 'Missing parent record — close and reopen this dialog.';
      if (!parent.email?.trim()) return 'This parent record has no email yet.';
      if (!primaryChild?.id) {
        return 'This parent isn’t linked to any children yet — add one before inviting.';
      }
      return null;
    }
    if (!form.email.trim()) return 'Parent email is required.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
    if (!primaryChild?.id) return 'Missing child — close and reopen this dialog.';
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const invite = await invitesApi.createParentInvite({
        email: mode === 'parent' ? parent.email : form.email,
        childId: primaryChild.id,
        childName: primaryChildName,
        // Option B path stamps parentId so the dashboard denormalizes
        // sibling childIds onto the invite (see invitesApi) AND the
        // accept flow flips parents.appStatus to 'active' on success.
        ...(mode === 'parent' && parent?.id ? { parentId: parent.id } : {}),
        invitedBy: user.uid,
        invitedByName: inviterDisplayName,
      });
      setCreatedInvite(invite);
      onCreated?.(invite);
    } catch (err) {
      console.error('[InviteParentModal] failed to create invite:', err);
      setError(
        err?.code === 'permission-denied'
          ? "You don't have permission to send invites. Contact support if this looks wrong."
          : 'Could not create the invite. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!createdInvite?.token) return;
    setResending(true);
    setResendResult(null);
    setResendError('');
    try {
      await emailApi.sendInvite(createdInvite.token);
      setResendResult('sent');
      setCreatedInvite((prev) => (prev ? { ...prev, emailSent: true, emailError: null } : prev));
    } catch (err) {
      console.error('[InviteParentModal] resend failed:', err);
      setResendResult('error');
      setResendError(err?.detail || err?.message || 'Could not resend email');
    } finally {
      setResending(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[InviteParentModal] clipboard write failed:', err);
      setError('Could not copy to clipboard. Select the URL manually and copy.');
    }
  };

  const handleSendAnother = () => {
    setCreatedInvite(null);
    // In parent-mode there's only one record per invite (the email is
    // locked), so "Send another" doesn't really apply — but we still
    // reset for symmetry. Owners can close and pick a different parent
    // card to invite a different family.
    setForm(mode === 'parent' ? { email: parent?.email || '' } : EMPTY_FORM);
    setError('');
    setCopied(false);
  };

  // Microcopy used in two places (result screen + confirm screen) — kept
  // as a single string so we don't drift the wording.
  const linkedChildrenLabel = useMemo(() => {
    if (linkedChildren.length === 0) return primaryChildName || 'this child';
    if (linkedChildren.length === 1) return primaryChildName;
    const others = linkedChildren.length - 1;
    return `${primaryChildName} and ${others} ${others === 1 ? 'sibling' : 'siblings'}`;
  }, [linkedChildren, primaryChildName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite a parent" size="md">
      {createdInvite ? (
        <>
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-surface-900">
              {createdInvite.emailSent ? 'Invite email sent' : 'Invite ready to share'}
            </h3>
            <p className="text-xs sm:text-sm text-surface-500 mt-1">
              {createdInvite.emailSent ? (
                <>
                  We emailed <span className="font-medium">{createdInvite.email}</span>{' '}
                  an activation link. They&apos;ll get connected to{' '}
                  <span className="font-medium">{linkedChildrenLabel}</span> after setting a password.
                </>
              ) : (
                <>
                  Send this link to <span className="font-medium">{createdInvite.email}</span>.
                  They&apos;ll set up their own password and get connected to{' '}
                  <span className="font-medium">{linkedChildrenLabel}</span>.
                </>
              )}
            </p>
          </div>

          {createdInvite.emailSent ? (
            <div className="flex items-center gap-2 p-3 bg-success-50 border border-success-200 rounded-xl text-xs sm:text-sm text-success-800 mb-3">
              <Mail className="w-4 h-4 flex-shrink-0" />
              Activation email delivered via Resend to <strong>{createdInvite.email}</strong>.
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-xl text-xs sm:text-sm text-warning-800 mb-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                Automatic email delivery failed — use the link below to share the
                invite manually, or retry sending.{' '}
                <span className="text-warning-700/80">
                  {createdInvite.emailError?.message || ''}
                </span>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Mail}
                    loading={resending}
                    onClick={handleResend}>
                    {resending ? 'Sending…' : 'Resend email'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {resendResult === 'error' ? (
            <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-xs sm:text-sm text-danger-700 mb-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                Retry failed: <span className="text-danger-600 break-words">{resendError}</span>
              </div>
            </div>
          ) : null}

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
            Link expires in 7 days. You can revoke it from this child&apos;s page anytime.
          </p>

          {error ? (
            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          ) : null}

          <ModalFooter>
            {mode === 'parent' ? null : (
              <Button variant="secondary" onClick={handleSendAnother}>
                Send another
              </Button>
            )}
            <Button onClick={onClose}>Done</Button>
          </ModalFooter>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
              <Heart className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-surface-700">
                {mode === 'parent' ? (
                  <>
                    You&apos;re giving{' '}
                    <span className="font-medium">
                      {`${parent?.firstName || ''} ${parent?.lastName || ''}`.trim() || 'this parent'}
                    </span>{' '}
                    access to the KidsHub parent app. We&apos;ll email an activation
                    link to their address — they set their own password from that link.
                  </>
                ) : (
                  <>
                    Send a secure link to{' '}
                    {primaryChildName ? <span className="font-medium">{primaryChildName}</span> : 'this child'}
                    &apos;s parent. We&apos;ll email them an activation link — they&apos;ll set up
                    their own KidsHub account and be connected automatically.
                  </>
                )}
              </div>
            </div>

            {mode === 'parent' ? (
              <div className="rounded-xl border border-surface-200 divide-y divide-surface-100">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="text-xs uppercase tracking-wide text-surface-400">
                    Email
                  </div>
                  <div className="text-sm text-surface-900 truncate">
                    {parent?.email || <span className="text-surface-400">—</span>}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="text-xs uppercase tracking-wide text-surface-400 mt-0.5">
                    Children
                  </div>
                  <div className="text-sm text-surface-900 text-right max-w-[60%]">
                    {linkedChildren.length > 0 ? (
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Users className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                        <span>
                          {linkedChildren
                            .map((c) => `${c.firstName || ''} ${c.lastName || ''}`.trim())
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-surface-400">No children linked</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Parent email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    className="pl-9"
                    disabled={submitting}
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-xs text-surface-400">
                  They&apos;ll have to register with this exact email.
                </p>
              </div>
            )}

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
