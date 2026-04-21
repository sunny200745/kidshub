import React, { useState } from 'react';
import { Plus, X, Award } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Select, Textarea, Badge } from '../ui';
import { staffApi } from '../../firebase/api';
import { useClassroomsData } from '../../hooks';

const roleOptions = [
  { value: 'Director', label: 'Director' },
  { value: 'Lead Teacher', label: 'Lead Teacher' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Teacher Assistant', label: 'Teacher Assistant' },
  { value: 'Substitute', label: 'Substitute' },
  { value: 'Admin', label: 'Admin Staff' },
];

const commonCertifications = [
  'CPR',
  'First Aid',
  'Early Childhood Education',
  'Montessori Certified',
  'Special Needs',
  'Child Development Associate (CDA)',
];

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'Teacher',
  classroom: '',
  certifications: [],
  hireDate: new Date().toISOString().split('T')[0],
  bio: '',
};

export function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const { data: classrooms } = useClassroomsData();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [certInput, setCertInput] = useState('');

  const classroomOptions = [
    { value: '', label: 'No Classroom (Admin/Floating)' },
    ...(classrooms?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCertification = (cert) => {
    if (cert && !formData.certifications.includes(cert)) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, cert],
      }));
    }
    setCertInput('');
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await staffApi.create({
        ...formData,
        avatar: null,
        status: 'offline',
        classroom: formData.classroom || null,
      });
      
      setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Error adding staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Staff Member" size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Basic Info */}
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
            placeholder="email@example.com"
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

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role *"
            name="role"
            options={roleOptions}
            value={formData.role}
            onChange={handleChange}
          />
          <Select
            label="Assigned Classroom"
            name="classroom"
            options={classroomOptions}
            value={formData.classroom}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Hire Date"
          name="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={handleChange}
        />

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Certifications
          </label>
          
          {/* Quick add common certifications */}
          <div className="flex flex-wrap gap-2 mb-3">
            {commonCertifications.map((cert) => (
              <button
                key={cert}
                type="button"
                onClick={() => addCertification(cert)}
                disabled={formData.certifications.includes(cert)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  formData.certifications.includes(cert)
                    ? 'bg-success-100 border-success-300 text-success-700 cursor-not-allowed'
                    : 'bg-white border-surface-200 text-surface-600 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {formData.certifications.includes(cert) ? '✓ ' : '+ '}{cert}
              </button>
            ))}
          </div>

          {/* Custom certification input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add custom certification"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification(certInput))}
            />
            <Button variant="secondary" onClick={() => addCertification(certInput)} icon={Plus}>
              Add
            </Button>
          </div>

          {/* Selected certifications */}
          {formData.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.certifications.map((cert, index) => (
                <Badge key={index} variant="info">
                  <Award className="w-3 h-3" />
                  {cert}
                  <button onClick={() => removeCertification(index)} className="ml-1 hover:text-info-800">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        <Textarea
          label="Bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Brief description about the staff member..."
          rows={3}
        />
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Add Staff Member
        </Button>
      </ModalFooter>
    </Modal>
  );
}
