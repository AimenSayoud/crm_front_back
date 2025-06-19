import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';

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

  // Event type options with icons
  const eventTypes = [
    { value: 'interview', label: 'Interview', icon: '🎯' },
    { value: 'followup', label: 'Follow-up', icon: '📞' },
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'other', label: 'Other', icon: '📅' }
  ];

  // Color options with better visual representation
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200' },
    { value: '#10B981', label: 'Green', color: '#10B981', bg: 'bg-green-50', border: 'border-green-200' },
    { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: '#F59E0B', label: 'Amber', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200' },
    { value: '#EF4444', label: 'Red', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
    { value: '#6B7280', label: 'Gray', color: '#6B7280', bg: 'bg-gray-50', border: 'border-gray-200' }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden"
        style={{ 
          backgroundColor: colors.card,
          border: `1px solid ${colors.border || '#e5e7eb'}`
        }}
      >
        {/* Header */}
        <div className="relative p-6 border-b" style={{ borderColor: colors.border || '#e5e7eb' }}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: formData.color + '20' }}
              >
                <span className="text-xl">📅</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold" style={{ color: colors.text }}>
                Create New Event
              </h3>
              <p className="text-sm mt-1" style={{ color: colors.secondary }}>
                Schedule your upcoming event
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.text }}>
                Event Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title for your event"
                error={errors.title}
                className="text-lg"
              />
            </div>

            {/* Event Type & Color Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: colors.text }}>
                  Event Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('type', type.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: colors.text }}>
                  Event Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => handleInputChange('color', colorOption.value)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        formData.color === colorOption.value 
                          ? 'border-gray-800 dark:border-white scale-110 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: colorOption.color }}
                      title={colorOption.label}
                    >
                      {formData.color === colorOption.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: colors.text }}>
                Date & Time *
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date & Time */}
                <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      Start
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      error={errors.startDate}
                    />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      error={errors.startTime}
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      End
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      error={errors.endDate}
                    />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      error={errors.endTime}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: colors.text }}>
                Description
              </label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add any additional details about this event..."
                rows={4}
                className="resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end space-x-3" style={{ borderColor: colors.border || '#e5e7eb' }}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            onClick={handleSubmit}
            className="px-6 py-2"
            style={{ backgroundColor: "rgb(15, 118, 110)" , color: 'white' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal; 