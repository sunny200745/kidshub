/**
 * InviteTeacherModal — owner-facing UI for issuing a teacher invite.
 *
 * Two-stage UX:
 *   Stage 1 (form):    email + classroom select + "Send invite" button
 *   Stage 2 (result):  shows the generated invite URL with copy-to-clipboard,
 *                      a deep link directly to it, and "Send another" / "Done"
 *
 * On submit we:
 *   1. invitesApi.create({ email, classroomId, classroomName, invitedBy,
 *      invitedByName, daycareId }) — writes invites/{token} via setDoc
 *   2. Display `${KIDSHUB_BASE_URL}/invite/{token}` for the owner to paste
 *      into an email/SMS/Slack DM.
 *
 * Email delivery is intentionally NOT wired here yet (no transactional email
 * provider in the MVP — would need Resend/SendGrid + a serverless route in
 * kidshub-landing). Copy/paste is fine for pilot; switch to email in p3-14
 * follow-up or Phase 4.
 *
 * Auth gating: the Firestore rule for invites/{token} create requires
 *   isOwner() && invitedBy == request.auth.uid
 * so this modal MUST be rendered inside ProtectedRoute (which already gates
 * the dashboard to owners). No extra check here.
 */
import { Check, Copy, ExternalLink, Mail, Send, UserPlus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../contexts';
import { invitesApi } from '../../firebase/api';
import { useClassroomsData } from '../../hooks';
import { Button, Input, Modal, ModalFooter, Select } from '../ui';

/**
 * Where the kidshub app lives. Read from Vite env at build time so the URL
 * follows the deploy environment. Falls back to localhost so local dev "just
 * works" without an env var.
 *
 * Production: set VITE_KIDSHUB_APP_URL=https://app.getkidshub.com in the
 * dashboard's Vercel project (or wherever it's deployed).
 */
const KIDSHUB_BASE_URL = (
  import.meta.env.VITE_KIDSHUB_APP_URL || 'http://localhost:5191'
).replace(/\/$/, '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  email: '',
  classroomId: '',
};

export function InviteTeacherModal({ isOpen, onClose, onCreated }) {
  const { user, profile } = useAuth();
  const { data: classrooms, loading: classroomsLoading } = useClassroomsData();

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

  const classroomOptions = useMemo(() => {
    const opts = (classrooms || []).map((c) => ({ value: c.id, label: c.name }));
    return [{ value: '', label: 'Select a classroom\u2026' }, ...opts];
  }, [classrooms]);

  // Reset all state on every open. Without this, the modal would still show
  // a previously-created invite if the owner clicks "Invite" right after closing.
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
    if (!form.email.trim()) return 'Teacher email is required.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
    if (!form.classroomId) return 'Please pick a classroom.';
    if (!user?.uid) return 'You must be signed in to send invites.';
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const classroom = classrooms?.find((c) => c.id === form.classroomId);

    setSubmitting(true);
    try {
      const invite = await invitesApi.create({
        email: form.email,
        classroomId: form.classroomId,
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

  const handleSendAnother = () => {
    setCreatedInvite(null);
    setForm(EMPTY_FORM);
    setError('');
    setCopied(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite a teacher" size="md">
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
                {createdInvite.classroomName || 'the classroom'}
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
            Link expires in 7 days. You can revoke it from the Pending invites list anytime.
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
              <UserPlus className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-surface-700">
                Teachers don&apos;t self-register. Send them an invite link and they&apos;ll
                set up their own password from the KidsHub app.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Teacher email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="teacher@example.com"
                  className="pl-9"
                  disabled={submitting}
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-surface-400">
                They&apos;ll have to register with this exact email.
              </p>
            </div>

            <Select
              label="Assign to classroom *"
              name="classroomId"
              options={classroomOptions}
              value={form.classroomId}
              onChange={handleChange}
              disabled={submitting || classroomsLoading || classroomOptions.length <= 1}
            />
            {!classroomsLoading && classroomOptions.length <= 1 ? (
              <p className="text-xs text-warning-700 -mt-2">
                You need to create a classroom first. Head to Classrooms to add one.
              </p>
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
            <Button onClick={handleSubmit} loading={submitting} icon={Send}>
              Create invite
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
