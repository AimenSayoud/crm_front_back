import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  candidateId?: string;
  companyId?: string;
  description?: string;
  type: 'interview' | 'followup' | 'meeting' | 'other';
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  selectedDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  selectedDate
}) => {
  const { colors } = useTheme();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as Event['type'],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    color: '#3B82F6'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Event type options
  const eventTypes = [
    { value: 'interview', label: 'Interview' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'other', label: 'Other' }
  ];

  // Color options
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: '#3B82F6' },
    { value: '#10B981', label: 'Green', color: '#10B981' },
    { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
    { value: '#F59E0B', label: 'Amber', color: '#F59E0B' },
    { value: '#EF4444', label: 'Red', color: '#EF4444' },
    { value: '#6B7280', label: 'Gray', color: '#6B7280' }
  ];

  // Set default date when modal opens or selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${(now.getHours() + 1).toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: currentTime,
        endTime: endTime
      }));
    }
  }, [selectedDate]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        type: 'meeting',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        color: '#3B82F6'
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Validate that end time is after start time
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    const newEvent: Omit<Event, 'id'> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      start: startDateTime,
      end: endDateTime,
      color: formData.color
    };

    onAddEvent(newEvent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.card }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold" style={{ color: colors.text }}>
            Add New Event
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Event Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              error={errors.title}
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Event Type
            </label>
            <Select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={eventTypes}
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date & Time */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  error={errors.startDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  error={errors.startTime}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  End Date *
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  error={errors.endDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  End Time *
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  error={errors.endTime}
                />
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Event Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => handleInputChange('color', colorOption.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === colorOption.value 
                      ? 'border-gray-800 dark:border-white scale-110' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter event description (optional)"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
            >
              Add Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal; 