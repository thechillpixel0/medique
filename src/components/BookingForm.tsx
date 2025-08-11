import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { BookingRequest } from '../types';

interface BookingFormProps {
  onSubmit: (data: BookingRequest) => Promise<void>;
  loading: boolean;
}

const departments = [
  { value: '', label: 'Select Department' },
  { value: 'general', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
];

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<BookingRequest>({
    name: '',
    age: 0,
    phone: '',
    department: '',
    payment_mode: 'pay_at_clinic',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<BookingRequest>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingRequest> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 1 || formData.age > 120) newErrors.age = 'Valid age is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone.length < 10) newErrors.phone = 'Phone number must be at least 10 digits';
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BookingRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter your full name"
          required
        />

        <Input
          label="Age"
          type="number"
          value={formData.age || ''}
          onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
          error={errors.age}
          placeholder="Enter your age"
          min="1"
          max="120"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          placeholder="Enter your phone number"
          required
        />

        <Select
          label="Department"
          value={formData.department}
          onChange={(e) => handleChange('department', e.target.value)}
          options={departments}
          error={errors.department}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="relative">
            <input
              type="radio"
              name="payment_mode"
              value="pay_at_clinic"
              checked={formData.payment_mode === 'pay_at_clinic'}
              onChange={(e) => handleChange('payment_mode', e.target.value as 'pay_now' | 'pay_at_clinic')}
              className="sr-only"
            />
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.payment_mode === 'pay_at_clinic'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <div className="font-medium text-gray-900">Pay at Clinic</div>
              <div className="text-sm text-gray-500">Pay when you arrive</div>
            </div>
          </label>

          <label className="relative">
            <input
              type="radio"
              name="payment_mode"
              value="pay_now"
              checked={formData.payment_mode === 'pay_now'}
              onChange={(e) => handleChange('payment_mode', e.target.value as 'pay_now' | 'pay_at_clinic')}
              className="sr-only"
            />
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.payment_mode === 'pay_now'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <div className="font-medium text-gray-900">Pay Now</div>
              <div className="text-sm text-gray-500">Online payment</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional information or special requirements..."
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        className="w-full"
        size="lg"
      >
        Book Token
      </Button>
    </form>
  );
};