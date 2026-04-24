/**
 * ParentFormModal — create or edit a parent contact record.
 *
 * Pass `parent` to enter edit mode (pre-fills form, updates on submit).
 * Without it, the modal is in create mode. Pass `preselectedChildId` to
 * seed the children checklist with one child already selected — used by
 * the ChildProfile deep-link path (`/parents?addFor={childId}`) so owners
 * landing there don't have to re-find the child in the list.
 *
 * Direct mirror of StaffFormModal — same shape, same lifecycle, same
 * QuotaBanner / error handling. Only structural difference: a multi-select
 * children checklist instead of a single-classroom dropdown, since one
 * parent record can be linked to multiple siblings.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Select } from '../ui';
import { parentsApi } from '../../firebase/api';
import { useChildrenData } from '../../hooks';
import { QuotaBanner } from '../QuotaBanner';

/**
 * Common relationship labels — kept short so the dropdown stays scannable.
 * "Other" lets owners type a custom value via a free-text fallback below.
 */
const relationshipOptions = [
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Step-parent', label: 'Step-parent' },
  { value: 'Foster parent', label: 'Foster parent' },
  { value: 'Other', label: 'Other' },
];

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  relationship: 'Mother',
  relationshipOther: '',
  childIds: [],
  emergencyContact: false,
  authorizedPickup: true,
};

function buildInitialForm(parent, preselectedChildId) {
  if (!parent) {
    return {
      ...initialFormData,
      childIds: preselectedChildId ? [preselectedChildId] : [],
    };
  }
  // Backward compat: legacy seeds use `children` instead of `childIds`.
  const fromRecord = Array.isArray(parent.childIds)
    ? parent.childIds
    : Array.isArray(parent.children)
      ? parent.children
      : [];
  // If the record's relationship matches a known option, use it; else
  // route to "Other" + free-text so we never silently drop custom labels
  // owners typed in earlier sessions.
  const knownRel = relationshipOptions.some((o) => o.value === parent.relationship);
  return {
    firstName: parent.firstName || '',
    lastName: parent.lastName || '',
    email: parent.email || '',
    phone: parent.phone || '',
    relationship: knownRel ? parent.relationship : 'Other',
    relationshipOther: knownRel ? '' : (parent.relationship || ''),
    childIds: fromRecord,
    emergencyContact: !!parent.emergencyContact,
    authorizedPickup: parent.authorizedPickup !== false,
  };
}

export function ParentFormModal({
  isOpen,
  onClose,
  onSuccess,
  parent,
  preselectedChildId,
}) {
  const isEdit = !!parent;
  const { data: children } = useChildrenData();

  const [formData, setFormData] = useState(() =>
    buildInitialForm(parent, preselectedChildId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotaError, setQuotaError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialForm(parent, preselectedChildId));
      setError('');
      setQuotaError(null);
    }
  }, [parent, preselectedChildId, isOpen]);

  // Sort children by name for a predictable checklist order. Memo keeps
  // the order stable across re-renders even as the underlying snapshot
  // re-fires (Firestore order is doc-id based, which is meaningless here).
  const sortedChildren = useMemo(() => {
    if (!Array.isArray(children)) return [];
    return [...children].sort((a, b) => {
      const aName = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
      const bName = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [children]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleChild = (childId) => {
    setFormData((prev) => {
      const has = prev.childIds.includes(childId);
      return {
        ...prev,
        childIds: has
          ? prev.childIds.filter((id) => id !== childId)
          : [...prev.childIds, childId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in first name, last name, and email.');
      return;
    }
    // The "Other" relationship branch needs a custom label — block submit
    // with no value so the parent record doesn't end up with the literal
    // string "Other" stored as the relationship.
    if (formData.relationship === 'Other' && !formData.relationshipOther.trim()) {
      setError('Please enter a relationship label, or pick from the list.');
      return;
    }

    setError('');
    setQuotaError(null);
    setLoading(true);
    try {
      const resolvedRelationship =
        formData.relationship === 'Other'
          ? formData.relationshipOther.trim()
          : formData.relationship;

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email,
        phone: formData.phone.trim() || null,
        relationship: resolvedRelationship,
        childIds: formData.childIds,
        emergencyContact: formData.emergencyContact,
        authorizedPickup: formData.authorizedPickup,
      };

      if (isEdit) {
        await parentsApi.update(parent.id, payload);
      } else {
        await parentsApi.create(payload);
      }

      if (!isEdit) setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'adding'} parent:`, err);
      if (err?.code === 'quota-exceeded') {
        setQuotaError(err);
      } else {
        setError(
          err?.code === 'permission-denied'
            ? "You don't have permission to do that. If this looks wrong, contact support."
            : `Could not ${isEdit ? 'save changes' : 'add parent'}. Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    if (!isEdit) setFormData(initialFormData);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Parent' : 'Add New Parent'}
      size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {quotaError ? <QuotaBanner error={quotaError} /> : null}
        {error ? (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
            {error}
          </div>
        ) : null}

        {!isEdit ? (
          <div className="flex items-start gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
            <Heart className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-surface-700">
              Add a parent contact first. Once saved, you can click{' '}
              <span className="font-medium">Invite to app</span> on their card to
              send a secure activation link. Linking siblings here means one
              invite covers them all.
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name *"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name *"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="parent@example.com"
            disabled={isEdit && parent?.appStatus === 'active'}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
          />
        </div>
        {isEdit && parent?.appStatus === 'active' ? (
          <p className="text-xs text-surface-400 -mt-2">
            Email is locked while the parent has app access — it&apos;s tied to
            their KidsHub account.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Relationship"
            name="relationship"
            options={relationshipOptions}
            value={formData.relationship}
            onChange={handleChange}
          />
          {formData.relationship === 'Other' ? (
            <Input
              label="Relationship label *"
              name="relationshipOther"
              value={formData.relationshipOther}
              onChange={handleChange}
              placeholder="e.g. Aunt, Family friend"
            />
          ) : (
            <div /> /* preserves the 2-col grid alignment */
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Linked children
          </label>
          <p className="text-xs text-surface-400 mb-2">
            Pick every child this parent should see in the app. Adding siblings
            here means one invite link connects them to all of them.
          </p>
          {sortedChildren.length === 0 ? (
            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-500">
              No children on file yet. Add a child first, then come back to
              link them.
            </div>
          ) : (
            <div className="border border-surface-200 rounded-xl divide-y divide-surface-100 max-h-48 overflow-y-auto">
              {sortedChildren.map((child) => {
                const checked = formData.childIds.includes(child.id);
                return (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChild(child.id)}
                      className="w-4 h-4 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
                    />
                    <span className="text-sm text-surface-900">
                      {child.firstName} {child.lastName}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-start gap-2 p-3 border border-surface-200 rounded-xl cursor-pointer hover:bg-surface-50 transition-colors">
            <input
              type="checkbox"
              name="emergencyContact"
              checked={formData.emergencyContact}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-surface-900">
                Emergency contact
              </p>
              <p className="text-xs text-surface-500">
                Reach out first in urgent situations.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-2 p-3 border border-surface-200 rounded-xl cursor-pointer hover:bg-surface-50 transition-colors">
            <input
              type="checkbox"
              name="authorizedPickup"
              checked={formData.authorizedPickup}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-surface-900">
                Authorized pickup
              </p>
              <p className="text-xs text-surface-500">
                Allowed to collect the child at the end of day.
              </p>
            </div>
          </label>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isEdit ? 'Save Changes' : 'Add Parent'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export const AddParentModal = ParentFormModal;
