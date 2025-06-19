// src/components/companies/CompanyDetailModal.tsx (updated)
import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { useFormValidation, required } from '@/hooks/useFormValidation';
import { Company, Job } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

function email() {
  return (value: unknown): string | undefined => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value) ? undefined : 'Invalid email address';
  };
}

function phoneNumber() {
  return (value: unknown): string | undefined => {
    if (!value) return undefined;
    // Simple phone validation - adjust according to your needs
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return typeof value === 'string' && phoneRegex.test(value) ? undefined : 'Invalid phone number';
  };
}

interface CompanyDetailModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
  isCreate?: boolean;
  jobs?: Job[];
}

const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  company,
  isOpen,
  onClose,
  onSave,
  isCreate = false,
  jobs = [],
}) => {
  const { colors } = useTheme();
  const user = useAuthStore(selectUser);
  const [activeTab, setActiveTab] = useState('details');
  
  // Initialize form with company data or empty values for new company
  const initialValues = company ? {
    name: company.name,
    industry: company.industry,
    website: company.website || '',
    contactPerson: company.contactPerson,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone || '',
    address: company.address || '',
    notes: company.notes || '',
    officeId: company.officeId,
  } : {
    name: '',
    industry: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    notes: '',
    officeId: user?.officeId || '1',
  };
  
  // Validation rules
  const validationRules = {
    name: [required('Company name')],
    industry: [required('Industry')],
    contactPerson: [required('Contact person')],
    contactEmail: [required('Contact email'), email()],
    contactPhone: [phoneNumber()],
  };
  
  const { 
    values, 
    errors, 
    handleChange, 
    validate,
  } = useFormValidation(initialValues, validationRules);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Convert form values back to company object
    const updatedCompany: Company = {
      id: company?.id || `temp-${Date.now()}`,
      name: values.name,
      industry: values.industry,
      website: values.website || undefined,
      contactPerson: values.contactPerson,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      officeId: values.officeId,
      createdAt: company?.createdAt || new Date(),
      updatedAt: new Date(),
      openPositions: company?.openPositions || 0,
    };
    
    onSave(updatedCompany);
    onClose();
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, delay: 0.1 } 
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        damping: 20,
        stiffness: 300
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20, 
      transition: { 
        duration: 0.2 
      } 
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 200
      } 
    },
    exit: { 
      opacity: 0, 
      x: 10,
      transition: {
        duration: 0.2
      }
    }
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2
      }
    })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div 
            className="rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: colors.card }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: colors.border }}>
              <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                {isCreate ? 'Add New Company' : company?.name}
              </h2>
              <motion.button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            <div className="flex border-b" style={{ borderColor: colors.border }}>
              <motion.button
                className={`px-6 py-3 font-medium text-sm ${activeTab === 'details' ? 'border-b-2' : ''}`}
                style={{ 
                  borderColor: activeTab === 'details' ? colors.primary : 'transparent',
                  color: activeTab === 'details' ? colors.primary : colors.text
                }}
                onClick={() => setActiveTab('details')}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.97 }}
              >
                Details
              </motion.button>
              
              {!isCreate && (
                <motion.button
                  className={`px-6 py-3 font-medium text-sm ${activeTab === 'jobs' ? 'border-b-2' : ''}`}
                  style={{ 
                    borderColor: activeTab === 'jobs' ? colors.primary : 'transparent',
                    color: activeTab === 'jobs' ? colors.primary : colors.text
                  }}
                  onClick={() => setActiveTab('jobs')}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Jobs
                </motion.button>
              )}
              
              {!isCreate && (
                <motion.button
                  className={`px-6 py-3 font-medium text-sm ${activeTab === 'activity' ? 'border-b-2' : ''}`}
                  style={{ 
                    borderColor: activeTab === 'activity' ? colors.primary : 'transparent',
                    color: activeTab === 'activity' ? colors.primary : colors.text
                  }}
                  onClick={() => setActiveTab('activity')}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Activity
                </motion.button>
              )}
            </div>
            
            <div className="overflow-y-auto p-6 flex-grow">
              <AnimatePresence mode="wait">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <motion.form 
                    key="details"
                    onSubmit={handleSubmit}
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Company Name"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          error={errors.name}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Industry"
                          name="industry"
                          value={values.industry}
                          onChange={handleChange}
                          error={errors.industry}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Website"
                          name="website"
                          value={values.website}
                          onChange={handleChange}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div custom={3} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Contact Person"
                          name="contactPerson"
                          value={values.contactPerson}
                          onChange={handleChange}
                          error={errors.contactPerson}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div custom={4} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Contact Email"
                          name="contactEmail"
                          type="email"
                          value={values.contactEmail}
                          onChange={handleChange}
                          error={errors.contactEmail}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div custom={5} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Contact Phone"
                          name="contactPhone"
                          value={values.contactPhone}
                          onChange={handleChange}
                          error={errors.contactPhone}
                          fullWidth
                        />
                      </motion.div>
                      
                      <motion.div className="md:col-span-2" custom={6} variants={formItemVariants} initial="hidden" animate="visible">
                        <Input
                          label="Address"
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                          fullWidth
                        />
                      </motion.div>
                      
                      {user?.role === 'super_admin' && (
                        <motion.div custom={7} variants={formItemVariants} initial="hidden" animate="visible">
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
                        </motion.div>
                      )}
                      
                      <motion.div className="md:col-span-2" custom={8} variants={formItemVariants} initial="hidden" animate="visible">
                        <TextArea
                          label="Notes"
                          name="notes"
                          value={values.notes}
                          onChange={handleChange}
                          rows={4}
                          fullWidth
                        />
                      </motion.div>
                    </div>
                  </motion.form>
                )}
                
                {/* Jobs Tab */}
                {activeTab === 'jobs' && !isCreate && (
                  <motion.div 
                    key="jobs"
                    className="space-y-4"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium" style={{ color: colors.text }}>Open Positions</h3>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="primary" 
                          size="sm"
                          leftIcon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          }
                        >
                          Add Job
                        </Button>
                      </motion.div>
                    </div>
                    
                    <Table
                      columns={[
                        {
                          key: 'title',
                          title: 'Position',
                          render: (value: unknown) => (
                            <div className="font-medium" style={{ color: colors.text }}>
                              {value as string}
                            </div>
                          ),
                        },
                        {
                          key: 'location',
                          title: 'Location',
                        },
                        {
                          key: 'status',
                          title: 'Status',
                          render: (value: unknown) => {
                            const statusValue = value as string;
                            const statusVariant: Record<string, 'primary' | 'success' | 'danger'> = {
                              open: 'primary',
                              filled: 'success',
                              closed: 'danger',
                            };
                            
                            return (
                              <Badge variant={statusVariant[statusValue] || 'default'}>
                                {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                              </Badge>
                            );
                          },
                        },
                        {
                          key: 'createdAt',
                          title: 'Date',
                          render: (value: unknown) => {
                            if (value instanceof Date) {
                              return <span>{value.toLocaleDateString()}</span>;
                            }
                            return <span>{String(value)}</span>;
                          },
                        },
                        {
                          key: 'actions',
                          title: 'Actions',
                          render: (_, record: Job) => (
                            <div className="flex space-x-2">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="sm" onClick={() => console.log(record)}>View</Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="danger" size="sm">Delete</Button>
                              </motion.div>
                            </div>
                          ),
                        },
                      ]}
                      data={jobs.filter(job => job.companyId === company?.id)}
                      rowKey={(record) => record.id}
                      emptyText="No open positions"
                    />
                  </motion.div>
                )}
                
                {/* Activity Tab */}
                {activeTab === 'activity' && !isCreate && (
                  <motion.div 
                    key="activity"
                    className="space-y-4"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <h3 className="font-medium" style={{ color: colors.text }}>Recent Activity</h3>
                    
                    <div className="relative pl-8 border-l-2" style={{ borderColor: `${colors.primary}60` }}>
                      {[
                        { 
                          action: 'New job added', 
                          details: 'Frontend Developer position was added', 
                          user: 'John Doe', 
                          date: '2 days ago' 
                        },
                        { 
                          action: 'Contact updated', 
                          details: 'Contact information was updated', 
                          user: 'Sarah Smith', 
                          date: '1 week ago' 
                        },
                        { 
                          action: 'Company created', 
                          details: 'Company was added to the system', 
                          user: 'John Doe', 
                          date: '1 month ago' 
                        },
                      ].map((activity, index) => (
                        <motion.div 
                          key={index} 
                          className="mb-6 relative"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2, duration: 0.3 }}
                        >
                          <motion.div 
                            className="w-4 h-4 rounded-full absolute -left-10 top-0.5"
                            style={{ backgroundColor: colors.primary }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              delay: index * 0.2 + 0.1, 
                              type: "spring", 
                              stiffness: 300, 
                              damping: 15 
                            }}
                          ></motion.div>
                          <div className="font-medium text-sm" style={{ color: colors.text }}>
                            {activity.action}
                          </div>
                          <div className="text-sm" style={{ color: `${colors.text}99` }}>
                            {activity.details}
                          </div>
                          <div className="text-xs mt-1" style={{ color: `${colors.text}60` }}>
                            {activity.user} · {activity.date}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex justify-end space-x-2 p-6 border-t" style={{ borderColor: colors.border }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </motion.div>
              {activeTab === 'details' && (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Button variant="primary" onClick={handleSubmit}>
                    {isCreate ? 'Create Company' : 'Save Changes'}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanyDetailModal;