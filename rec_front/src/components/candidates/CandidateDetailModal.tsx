// src/components/candidates/CandidateDetailModal.tsx
import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Badge from '@/components/ui/Badge';
import { useFormValidation, required } from '@/hooks/useFormValidation';
import { Candidate } from '@/types';

export const email = () => (value: unknown) => {
  if (!value) return undefined;
  
  const stringValue = String(value);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(stringValue) ? undefined : 'Invalid email address';
};

export const phoneNumber = () => (value: unknown) => {
  if (!value) return undefined;
  
  const stringValue = String(value);
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(stringValue) ? undefined : 'Invalid phone number';
};

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  isCreate?: boolean;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSave,
  isCreate = false,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore(selectUser);
  const [activeTab, setActiveTab] = useState('details');
  
  // Initialize form with candidate data or empty values for new candidate
  const initialValues = candidate ? {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position,
    status: candidate.status,
    tags: candidate.tags.join(', '),
    notes: '',
    rating: candidate.rating?.toString() || '',
    assignedTo: candidate.assignedTo || '',
    officeId: candidate.officeId,
  } : {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    status: 'new',
    tags: '',
    notes: '',
    rating: '',
    assignedTo: user?.id || '',
    officeId: user?.officeId || '1',
  };
  
  // Validation rules
  const validationRules = {
    firstName: [required('First name')],
    lastName: [required('Last name')],
    email: [required('Email'), email()],
    phone: [phoneNumber()],
    position: [required('Position')],
  };
  
  const { 
    values, 
    errors, 
    handleChange, 
    //setFieldValue, 
    validate,
  } = useFormValidation(initialValues, validationRules);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Convert form values back to candidate object
    const updatedCandidate: Candidate = {
      id: candidate?.id || `temp-${Date.now()}`,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      position: values.position,
      status: values.status as Candidate['status'],
      tags: values.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      rating: values.rating ? parseInt(values.rating, 10) : undefined,
      assignedTo: values.assignedTo || undefined,
      officeId: values.officeId,
      createdAt: candidate?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    onSave(updatedCandidate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: colors.card }}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: colors.border }}>
          <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
            {isCreate ? 'Add New Candidate' : `${candidate?.firstName} ${candidate?.lastName}`}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b" style={{ borderColor: colors.border }}>
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === 'details' ? 'border-b-2' : ''}`}
            style={{ 
              borderColor: activeTab === 'details' ? colors.primary : 'transparent',
              color: activeTab === 'details' ? colors.primary : colors.text
            }}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          
          {!isCreate && (
            <button
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'history' ? 'border-b-2' : ''}`}
              style={{ 
                borderColor: activeTab === 'history' ? colors.primary : 'transparent',
                color: activeTab === 'history' ? colors.primary : colors.text
              }}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          )}
          
          {!isCreate && (
            <button
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'documents' ? 'border-b-2' : ''}`}
              style={{ 
                borderColor: activeTab === 'documents' ? colors.primary : 'transparent',
                color: activeTab === 'documents' ? colors.primary : colors.text
              }}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto p-6 flex-grow">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  fullWidth
                />
                
                <Input
                  label="Last Name"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  fullWidth
                />
                
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                  fullWidth
                />
                
                <Input
                  label="Phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  fullWidth
                />
                
                <Input
                  label="Position"
                  name="position"
                  value={values.position}
                  onChange={handleChange}
                  error={errors.position}
                  fullWidth
                />
                
                <Select
                  label="Status"
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'interview', label: 'Interview' },
                    { value: 'offer', label: 'Offer' },
                    { value: 'hired', label: 'Hired' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  fullWidth
                />
                
                <Input
                  label="Tags (comma separated)"
                  name="tags"
                  value={values.tags}
                  onChange={handleChange}
                  fullWidth
                />
                
                <Input
                  label="Rating (1-5)"
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={values.rating}
                  onChange={handleChange}
                  fullWidth
                />
                
                <Select
                  label="Assigned To"
                  name="assignedTo"
                  value={values.assignedTo}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Unassigned' },
                    { value: 'user-1', label: 'User 1' },
                    { value: 'user-2', label: 'User 2' },
                    { value: 'user-3', label: 'User 3' },
                  ]}
                  fullWidth
                />
                
                {user?.role === 'super_admin' && (
                  <Select
                    label="Office"
                    name="officeId"
                    value={values.officeId}
                    onChange={handleChange}
                    options={[
                      { value: '1', label: 'Office 1' },
                      { value: '2', label: 'Office 2' },
                      { value: '3', label: 'Office 3' },
                    ]}
                    fullWidth
                  />
                )}
              </div>
              
              <div className="mt-4">
                <TextArea
                  label="Notes"
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  rows={4}
                  fullWidth
                />
              </div>
            </form>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && !isCreate && (
            <div className="space-y-4">
              <h3 className="font-medium" style={{ color: colors.text }}>Activity History</h3>
              
              <div className="relative pl-8 border-l-2" style={{ borderColor: `${colors.primary}60` }}>
                {[
                  { 
                    action: 'Status updated', 
                    details: 'Status changed from New to Interview', 
                    user: 'John Doe', 
                    date: '2 days ago' 
                  },
                  { 
                    action: 'Note added', 
                    details: 'Added interview feedback', 
                    user: 'Sarah Smith', 
                    date: '3 days ago' 
                  },
                  { 
                    action: 'Candidate created', 
                    details: 'New candidate added to the system', 
                    user: 'John Doe', 
                    date: '1 week ago' 
                  },
                ].map((activity, index) => (
                  <div key={index} className="mb-6 relative">
                    <div 
                      className="w-4 h-4 rounded-full absolute -left-10 top-0.5"
                      style={{ backgroundColor: colors.primary }}
                    ></div>
                    <div className="font-medium text-sm" style={{ color: colors.text }}>
                      {activity.action}
                    </div>
                    <div className="text-sm" style={{ color: `${colors.text}99` }}>
                      {activity.details}
                    </div>
                    <div className="text-xs mt-1" style={{ color: `${colors.text}60` }}>
                      {activity.user} · {activity.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && !isCreate && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium" style={{ color: colors.text }}>Documents</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Upload Document
                </Button>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Resume.pdf', type: 'CV', uploadedBy: 'John Doe', date: '1 week ago' },
                  { name: 'Cover_Letter.pdf', type: 'Cover Letter', uploadedBy: 'John Doe', date: '1 week ago' },
                  { name: 'Portfolio.pdf', type: 'Portfolio', uploadedBy: 'Sarah Smith', date: '3 days ago' },
                ].map((document, index) => (
                  <div 
                    key={index}
                    className="p-3 border rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-center">
                      <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-sm" style={{ color: colors.text }}>
                          {document.name}
                        </div>
                        <div className="text-xs" style={{ color: `${colors.text}60` }}>
                          {document.uploadedBy} · {document.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="primary">{document.type}</Badge>
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="danger" size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 p-6 border-t" style={{ borderColor: colors.border }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'details' && (
            <Button variant="primary" onClick={handleSubmit}>
              {isCreate ? 'Create Candidate' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;