import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';

/**
 * ConfirmDialog — shared confirmation prompt for destructive actions.
 *
 * Two modes:
 *   1. Unblocked (default): renders `message` + Cancel/Confirm buttons.
 *   2. Blocked: when `blocked` is true, swaps the Confirm button for a
 *      disabled state and shows `blockedReason` so the caller can explain
 *      why the action can't proceed (e.g. "3 children still assigned to
 *      this classroom"). The caller is responsible for computing whether
 *      the action is blocked — this component just renders the decision.
 *
 * `onConfirm` is awaited; while in-flight, buttons are disabled and the
 * Confirm label shows a spinner. Dialog auto-closes on success. Any error
 * thrown by `onConfirm` propagates to the caller's `.catch` handler and
 * the dialog stays open so the caller can show an inline error if needed.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  blocked = false,
  blockedReason,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (blocked || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('[ConfirmDialog] action failed:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="flex gap-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-danger-100 text-danger-600' : 'bg-brand-100 text-brand-600'
          }`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {blocked && blockedReason ? (
            <>
              <p className="text-sm text-surface-700 mb-3">{blockedReason}</p>
              {message ? <p className="text-sm text-surface-500">{message}</p> : null}
            </>
          ) : (
            <p className="text-sm text-surface-700">{message}</p>
          )}

          {error ? (
            <p
              className="text-sm text-danger-600 mt-3"
              accessibilityLiveRegion="polite">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          {blocked ? 'Close' : cancelLabel}
        </Button>
        {!blocked && (
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={submitting}
            disabled={submitting}>
            {confirmLabel}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
