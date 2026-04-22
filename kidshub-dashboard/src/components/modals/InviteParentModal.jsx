/**
 * InviteParentModal — owner-facing UI for issuing a parent invite (p3-20).
 *
 * Mirrors InviteTeacherModal but scoped to a specific child instead of a
 * classroom. The caller passes the child object; we pre-fill the invite
 * with childId + childName so the kidshub accept screen can render
 * "You're invited to connect with {childName}".
 *
 * Two-stage UX:
 *   Stage 1 (form):    email + "Send invite"
 *   Stage 2 (result):  shows the generated invite URL with copy-to-clipboard
 *
 * Security: the Firestore rule for invites/{token} create with role='parent'
 * requires:
 *   - isOwner()
 *   - invitedBy == request.auth.uid
 *   - daycareId == request.auth.uid
 *   - childId is a string
 * This modal is rendered inside ProtectedRoute (owner-gated), and we pass
 * invitedBy + daycareId through invitesApi from user.uid.
 */
import { Check, Copy, ExternalLink, Mail, Send, Heart } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../contexts';
import { invitesApi } from '../../firebase/api';
import { Button, Input, Modal, ModalFooter } from '../ui';

/**
 * Where the kidshub app lives. Same env var as InviteTeacherModal —
 * keep in sync if you add more deploy targets.
 */
const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5191'
).replace(/\/$/, '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = { email: '' };

export function InviteParentModal({ isOpen, onClose, onCreated, child }) {
  const { user, profile } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
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

  const childName = useMemo(() => {
    if (!child) return '';
    return `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim();
  }, [child]);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError('');
      setCreatedInvite(null);
      setCopied(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const inviteUrl = createdInvite
    ? `${KIDSHUB_BASE_URL}/invite/${createdInvite.token}`
    : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.email.trim()) return 'Parent email is required.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
    if (!child?.id) return 'Missing child — close and reopen this dialog.';
    if (!user?.uid) return 'You must be signed in to send invites.';
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
        email: form.email,
        childId: child.id,
        childName,
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
    setForm(EMPTY_FORM);
    setError('');
    setCopied(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite a parent" size="md">
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
              They&apos;ll set up their own password and get connected to{' '}
              <span className="font-medium">{childName}</span>.
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
            Link expires in 7 days. You can revoke it from this child&apos;s page anytime.
          </p>

          {error ? (
            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          ) : null}

          <ModalFooter>
            <Button variant="secondary" onClick={handleSendAnother}>
              Send another
            </Button>
            <Button onClick={onClose}>Done</Button>
          </ModalFooter>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
              <Heart className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-surface-700">
                Send a secure link to {childName ? <span className="font-medium">{childName}</span> : 'this child'}&apos;s
                parent. They&apos;ll set up their own KidsHub account and be connected automatically.
              </div>
            </div>

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
            <Button onClick={handleSubmit} loading={submitting} icon={Send}>
              Create invite
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
