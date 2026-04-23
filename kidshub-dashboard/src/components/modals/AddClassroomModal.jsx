/**
 * ClassroomFormModal — create or edit a classroom.
 *
 * Pass `classroom` to enter edit mode (pre-fills form, updates on submit).
 * Without it, the modal is in create mode. `AddClassroomModal` is kept as a
 * named alias for backward compatibility; all new callers should prefer
 * `ClassroomFormModal`.
 */
import React, { useEffect, useState } from 'react';
import { Plus, X, Clock } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Textarea } from '../ui';
import { classroomsApi } from '../../firebase/api';
import { QuotaBanner } from '../QuotaBanner';

const colorOptions = [
  { value: '#FF2D8A', label: 'Pink' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
];

const defaultSchedule = [
  { time: '7:00 AM', activity: 'Arrival & Free Play' },
  { time: '8:30 AM', activity: 'Breakfast' },
  { time: '9:00 AM', activity: 'Morning Circle Time' },
  { time: '9:30 AM', activity: 'Learning Activities' },
  { time: '10:30 AM', activity: 'Snack Time' },
  { time: '11:00 AM', activity: 'Outdoor Play' },
  { time: '12:00 PM', activity: 'Lunch' },
  { time: '12:45 PM', activity: 'Nap/Rest Time' },
  { time: '2:30 PM', activity: 'Wake Up & Snack' },
  { time: '3:00 PM', activity: 'Afternoon Activities' },
  { time: '4:00 PM', activity: 'Outdoor Play' },
  { time: '5:30 PM', activity: 'Free Play & Pickup' },
];

const initialFormData = {
  name: '',
  ageGroup: '',
  ageRange: '',
  capacity: 12,
  description: '',
  color: '#FF2D8A',
  schedule: defaultSchedule,
};

function buildInitialForm(classroom) {
  if (!classroom) return initialFormData;
  return {
    name: classroom.name || '',
    ageGroup: classroom.ageGroup || '',
    ageRange: classroom.ageRange || '',
    capacity: classroom.capacity ?? 12,
    description: classroom.description || '',
    color: classroom.color || '#FF2D8A',
    schedule: Array.isArray(classroom.schedule) && classroom.schedule.length
      ? classroom.schedule
      : defaultSchedule,
  };
}

export function ClassroomFormModal({ isOpen, onClose, onSuccess, classroom }) {
  const isEdit = !!classroom;

  const [formData, setFormData] = useState(() => buildInitialForm(classroom));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quotaError, setQuotaError] = useState(null);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleActivity, setNewScheduleActivity] = useState('');

  // Re-sync form when the classroom prop changes (e.g. clicking Edit on a
  // different classroom without closing the modal first).
  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialForm(classroom));
      setError('');
      setQuotaError(null);
    }
  }, [classroom, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addScheduleItem = () => {
    if (newScheduleTime && newScheduleActivity) {
      setFormData((prev) => ({
        ...prev,
        schedule: [...prev.schedule, { time: newScheduleTime, activity: newScheduleActivity }],
      }));
      setNewScheduleTime('');
      setNewScheduleActivity('');
    }
  };

  const removeScheduleItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.ageGroup || !formData.capacity) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setQuotaError(null);
    setLoading(true);
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
      };
      if (isEdit) {
        await classroomsApi.update(classroom.id, payload);
      } else {
        await classroomsApi.create({
          ...payload,
          currentCount: 0,
          staff: [],
          leadTeacher: null,
        });
      }

      if (!isEdit) setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'adding'} classroom:`, err);
      if (err?.code === 'quota-exceeded') {
        setQuotaError(err);
      } else {
        setError(
          err?.code === 'permission-denied'
            ? "You don't have permission to do that. If this looks wrong, contact support."
            : `Could not ${isEdit ? 'save changes' : 'add classroom'}. Please try again.`
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
      title={isEdit ? 'Edit Classroom' : 'Add New Classroom'}
      size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {quotaError ? <QuotaBanner error={quotaError} /> : null}
        {error ? (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Classroom Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Sunshine Room"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age Group *"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            placeholder="e.g., Toddlers"
          />
          <Input
            label="Age Range"
            name="ageRange"
            value={formData.ageRange}
            onChange={handleChange}
            placeholder="e.g., 18 months - 2.5 years"
          />
        </div>

        <Input
          label="Capacity *"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange}
          min="1"
          max="30"
        />

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Classroom Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                className={`w-10 h-10 rounded-xl transition-all ${
                  formData.color === color.value ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe this classroom..."
          rows={2}
        />

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Daily Schedule
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="input w-28"
              placeholder="Time"
              value={newScheduleTime}
              onChange={(e) => setNewScheduleTime(e.target.value)}
            />
            <input
              type="text"
              className="input flex-1"
              placeholder="Activity"
              value={newScheduleActivity}
              onChange={(e) => setNewScheduleActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addScheduleItem())}
            />
            <Button variant="secondary" onClick={addScheduleItem} icon={Plus}>
              Add
            </Button>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {formData.schedule.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-surface-50 rounded-lg">
                <Clock className="w-4 h-4 text-surface-400" />
                <span className="w-20 text-sm font-medium text-surface-600">{item.time}</span>
                <span className="flex-1 text-sm text-surface-800">{item.activity}</span>
                <button
                  onClick={() => removeScheduleItem(index)}
                  className="p-1 hover:bg-surface-200 rounded">
                  <X className="w-4 h-4 text-surface-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isEdit ? 'Save Changes' : 'Add Classroom'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Back-compat alias. New code should import ClassroomFormModal directly.
export const AddClassroomModal = ClassroomFormModal;
