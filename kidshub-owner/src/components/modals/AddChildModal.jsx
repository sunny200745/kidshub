import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Select, Textarea, Badge } from '../ui';
import { childrenApi } from '../../firebase/api';
import { useClassroomsData } from '../../hooks';

const initialFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'Male',
  classroom: '',
  allergies: [],
  medicalConditions: [],
  dietaryRestrictions: [],
  specialInstructions: '',
  schedule: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
  },
};

export function AddChildModal({ isOpen, onClose, onSuccess }) {
  const { data: classrooms } = useClassroomsData();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [dietaryInput, setDietaryInput] = useState('');

  const classroomOptions = [
    { value: '', label: 'Select Classroom' },
    ...(classrooms?.map((c) => ({ value: c.id, label: `${c.name} (${c.ageGroup})` })) || []),
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: !prev.schedule[day] },
    }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()],
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, conditionInput.trim()],
      }));
      setConditionInput('');
    }
  };

  const removeCondition = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index),
    }));
  };

  const addDietary = () => {
    if (dietaryInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, dietaryInput.trim()],
      }));
      setDietaryInput('');
    }
  };

  const removeDietary = (index) => {
    setFormData((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter((_, i) => i !== index),
    }));
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.classroom) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await childrenApi.create({
        ...formData,
        age: calculateAge(formData.dateOfBirth),
        status: 'absent',
        checkInTime: null,
        avatar: null,
        parents: [],
        emergencyContacts: [],
        authorizedPickups: [],
        enrollmentDate: new Date().toISOString().split('T')[0],
      });
      
      setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Error adding child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Child" size="lg">
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
            label="Date of Birth *"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
          <Select
            label="Gender"
            name="gender"
            options={genderOptions}
            value={formData.gender}
            onChange={handleChange}
          />
        </div>

        <Select
          label="Classroom *"
          name="classroom"
          options={classroomOptions}
          value={formData.classroom}
          onChange={handleChange}
        />

        {/* Weekly Schedule */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Weekly Schedule
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(formData.schedule).map(([day, enrolled]) => (
              <button
                key={day}
                type="button"
                onClick={() => handleScheduleChange(day)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  enrolled
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-100 text-surface-500'
                }`}
              >
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Allergies
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add allergy"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            />
            <Button variant="secondary" onClick={addAllergy} icon={Plus}>
              Add
            </Button>
          </div>
          {formData.allergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.allergies.map((allergy, index) => (
                <Badge key={index} variant="danger">
                  <AlertTriangle className="w-3 h-3" />
                  {allergy}
                  <button onClick={() => removeAllergy(index)} className="ml-1 hover:text-danger-800">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Medical Conditions
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add medical condition"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
            />
            <Button variant="secondary" onClick={addCondition} icon={Plus}>
              Add
            </Button>
          </div>
          {formData.medicalConditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.medicalConditions.map((condition, index) => (
                <Badge key={index} variant="warning">
                  {condition}
                  <button onClick={() => removeCondition(index)} className="ml-1 hover:text-warning-800">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Dietary Restrictions
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add dietary restriction"
              value={dietaryInput}
              onChange={(e) => setDietaryInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietary())}
            />
            <Button variant="secondary" onClick={addDietary} icon={Plus}>
              Add
            </Button>
          </div>
          {formData.dietaryRestrictions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.dietaryRestrictions.map((restriction, index) => (
                <Badge key={index} variant="neutral">
                  {restriction}
                  <button onClick={() => removeDietary(index)} className="ml-1 hover:text-surface-800">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <Textarea
          label="Special Instructions"
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleChange}
          placeholder="Any special instructions for care..."
          rows={3}
        />
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Add Child
        </Button>
      </ModalFooter>
    </Modal>
  );
}
