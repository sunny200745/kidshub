/**
 * AnnouncementFormModal — create or edit an announcement.
 *
 * Pass `announcement` to enter edit mode (pre-fills form, updates on submit).
 * Without it, the modal is in create mode. We keep a short list of fields
 * (title, content, priority, targetAudience) to match what the existing
 * Dashboard sidebar renders and what seedData produces; anything else is
 * preserved on the doc so we don't accidentally wipe server-managed fields.
 */
import React, { useEffect, useState } from 'react';
import { Modal, ModalFooter, Button, Input, Textarea, Select } from '../ui';
import { announcementsApi } from '../../firebase/api';
import { auth } from '../../firebase/config';

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Important' },
];

const initialFormData = {
  title: '',
  content: '',
  priority: 'normal',
  targetAudience: 'all',
};

function buildInitialForm(announcement) {
  if (!announcement) return initialFormData;
  return {
    title: announcement.title || '',
    content: announcement.content || '',
    priority: announcement.priority || 'normal',
    targetAudience: announcement.targetAudience || 'all',
  };
}

export function AnnouncementFormModal({ isOpen, onClose, onSuccess, announcement, classrooms = [] }) {
  const isEdit = !!announcement;

  const [formData, setFormData] = useState(() => buildInitialForm(announcement));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialForm(announcement));
      setError('');
    }
  }, [announcement, isOpen]);

  const audienceOptions = [
    { value: 'all', label: 'Everyone' },
    ...classrooms.map((c) => ({ value: `classroom:${c.id}`, label: `${c.name} only` })),
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and message are required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        targetAudience: formData.targetAudience,
      };
      if (isEdit) {
        await announcementsApi.update(announcement.id, payload);
      } else {
        await announcementsApi.create({
          ...payload,
          author: auth?.currentUser?.uid || null,
        });
      }

      if (!isEdit) setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} announcement:`, err);
      setError(
        err?.code === 'permission-denied'
          ? "You don't have permission to do that."
          : `Could not ${isEdit ? 'save changes' : 'post announcement'}. Please try again.`
      );
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
      title={isEdit ? 'Edit Announcement' : 'New Announcement'}
      size="md">
      <div className="space-y-4">
        {error ? (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Title *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Center closed Monday"
        />

        <Textarea
          label="Message *"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="What do you want to tell families?"
          rows={5}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
          />
          <Select
            label="Send to"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            options={audienceOptions}
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isEdit ? 'Save Changes' : 'Post Announcement'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
