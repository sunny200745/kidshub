/**
 * ContactSalesModal — self-contained modal that posts leads to the
 * kidshub-landing `/api/contact-sales` endpoint (E2).
 *
 * Extracted from Plans.jsx so both /plans AND /paywall can open the
 * same form without duplicating the 200-line JSX. Consumers mount it
 * conditionally (`{isOpen && <ContactSalesModal ... />}`) so every
 * reopen starts with a fresh form — that's the UX our users expect
 * after cancelling midway.
 *
 * Two render states:
 *   1. Form — name/email/tier/message. On submit, POSTs the lead.
 *   2. Success — confirmation panel with a prominent Close button.
 *
 * Close is guarded while `submitting` so users can't dismiss a request
 * mid-flight and lose their own confirmation.
 */
import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { Button, Modal, ModalFooter } from './ui';
import {
  FEATURE_LABELS,
  PURCHASABLE_TIERS,
  TIERS,
} from '../config/product';

// Landing-hosted endpoint. Absolute URL so dashboard.getkidshub.com can hit
// getkidshub.com/api/contact-sales without a CORS proxy — the endpoint's
// allowlist (see kidshub-landing/api/_shared.js) already covers both hosts.
export const CONTACT_SALES_URL =
  import.meta.env.VITE_CONTACT_SALES_URL ||
  'https://getkidshub.com/api/contact-sales';

export function ContactSalesModal({
  isOpen,
  onClose,
  contactUrl = CONTACT_SALES_URL,
  interestTier,
  interestFeature,
  user,
  center,
  /** Tag for lead analytics — e.g. 'dashboard:/plans', 'dashboard:/paywall'. */
  source = 'dashboard:/plans',
  /** Optional headline override for the form state (not success state). */
  headline,
  /** Optional subheadline override for the form state. */
  subheadline,
}) {
  const [name, setName] = useState(user?.displayName || center?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [tier, setTier] = useState(interestTier || 'pro');
  const [message, setMessage] = useState(
    interestFeature
      ? `I'd like to unlock ${FEATURE_LABELS[interestFeature] || interestFeature}.`
      : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('Please fill in your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(contactUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          source,
          tier,
          feature: interestFeature || null,
          message,
          centerName: center?.name || null,
          ownerUid: user?.uid || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed (${res.status}): ${text}`);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('[ContactSalesModal] submit failed:', err);
      setError(
        'We could not send that just yet. Please email support@nuvaro.ca directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Request sent"
        size="md"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-success-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-surface-900">
              Thanks — we're on it.
            </h3>
            <p className="text-sm text-surface-600 mt-1">
              We'll reach out within one business day with pricing and next
              steps for {TIERS[tier].name}. If it's urgent, email us at{' '}
              <a
                href="mailto:support@nuvaro.ca"
                className="text-brand-600 font-semibold"
              >
                support@nuvaro.ca
              </a>
              .
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={headline || 'Contact sales'}
      size="lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-brand-600" />
        </div>
        <p className="text-sm text-surface-500">
          {subheadline ||
            "Tell us about your daycare and we'll get back within one business day."}
        </p>
      </div>

      {error && (
        <div className="p-3 mb-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
          {error}
        </div>
      )}

      <form id="contact-sales-form" className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-surface-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-surface-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-500 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Interested in
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full border border-surface-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-500 outline-none"
          >
            {PURCHASABLE_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIERS[t].name}{' '}
                {TIERS[t].monthlyPriceUsd
                  ? `— $${TIERS[t].monthlyPriceUsd}/mo`
                  : '— Free'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Tell us a bit about your daycare (optional)
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-surface-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-300 focus:border-brand-500 outline-none"
            placeholder="Size, classrooms, pain points, go-live timeline…"
          />
        </div>
      </form>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="contact-sales-form"
          variant="primary"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send request'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
