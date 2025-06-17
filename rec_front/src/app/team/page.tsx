// src/app/team/page.tsx
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectCanAccess } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { apiService } from '@/lib';
import { useApiQuery } from '@/hooks/useApiQuery';
import { User, Office } from '@/types';

// Form validation utility
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const TeamPage = () => {
  const { colors } = useTheme();
  const currentUser = useAuthStore(selectUser);
  const canAccess = useAuthStore(selectCanAccess);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    officeId: '1',
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
  });

  // Fetch users and offices based on current user's access
  const { data: users, loading, error, refetch } = useApiQuery<User[]>(
    () => apiService.users
      .getAll(currentUser?.role === 'super_admin' ? undefined : currentUser?.officeId)
      .then(res => res.items),
    [currentUser?.role, currentUser?.officeId]
  );
  
  const { data: offices } = useApiQuery<Office[]>(
    () => apiService.offices.getAll(),
    []
  );

  // Check if user has admin access
  const hasAdminAccess = canAccess('admin');

  // Filter users based on search term
  const filteredUsers = users
    ? users.filter(
        user =>
          searchTerm === '' ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;
    const errors = {
      name: '',
      email: '',
    };
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // In a real app, this would call an API to add/update user
    console.log('Form submitted:', formData);
    
    // Reset form and close modal
    setFormData({
      name: '',
      email: '',
      role: 'employee',
      officeId: '1',
    });
    
    setShowAddModal(false);
    setShowEditModal(false);
    
    // Refresh user list
    refetch();
  };

  // Handle edit user click
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      officeId: user.officeId,
    });
    setShowEditModal(true);
  };

  // Define table columns
  const tableColumns = [
    {
      key: 'name',
      title: 'Name',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      render: (value: unknown, record: User) => (
        <div className="flex items-center">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2"
            style={{ backgroundColor: colors.primary }}
          >
            {String(value).charAt(0)}
          </div>
          <div className="font-medium" style={{ color: colors.text }}>
            {String(value)}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (value: unknown) => <span>{String(value)}</span>,
    },
    {
      key: 'role',
      title: 'Role',
      render: (value: unknown) => {
        const roleMap: Record<string, { label: string, variant: 'primary' | 'secondary' | 'success' }> = {
          'super_admin': { label: 'Super Admin', variant: 'primary' },
          'admin': { label: 'Admin', variant: 'secondary' },
          'employee': { label: 'Employee', variant: 'success' },
        };
        
        const role = roleMap[String(value)] || { label: String(value), variant: 'default' };
        
        return (
          <Badge variant={role.variant}>
            {role.label}
          </Badge>
        );
      },
    },
    {
      key: 'officeId',
      title: 'Office',
      render: (value: unknown) => {
        const office = offices?.find(o => o.id === String(value));
        return <span>{office ? office.name : `Office ${value}`}</span>;
      },
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      render: (value: unknown) => {
        const date = value instanceof Date ? value : new Date(String(value));
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: unknown, record: User) => (
        <div className="flex space-x-2">
          {hasAdminAccess && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUser(record);
                }}
              >
                Edit
              </Button>
              <Button 
                variant="danger" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // In a real app, this would show a confirmation modal
                  console.log('Delete user:', record.id);
                }}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // If user doesn't have admin access, remove the actions column
  const filteredColumns = hasAdminAccess ? tableColumns : tableColumns.filter(col => col.key !== 'actions');

  // Handle error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div
          className="p-4 rounded-md mb-4"
          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
        >
          <p>Error loading team members: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Team
        </h1>
        {hasAdminAccess && (
          <Button 
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
            onClick={() => setShowAddModal(true)}
          >
            Add Team Member
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          
          {currentUser?.role === 'super_admin' && (
            <div className="flex items-center space-x-2">
              <Select
                options={[
                  { value: '', label: 'All Offices' },
                  ...(offices?.map(office => ({ value: office.id, label: office.name })) || []),
                ]}
                value=""
                onChange={(e) => console.log('Filter by office:', e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Total Team Members</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {loading ? '...' : users?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Admins</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {loading
                  ? '...'
                  : users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Offices</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {loading ? '...' : offices?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding>
        <Table
          columns={filteredColumns}
          data={filteredUsers}
          loading={loading}
          rowKey={(record) => record.id}
          emptyText="No team members found"
        />
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: colors.card }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Add Team Member
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={formErrors.name}
                fullWidth
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
                fullWidth
              />
              
              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'admin', label: 'Admin' },
                  ...(currentUser?.role === 'super_admin' ? [{ value: 'super_admin', label: 'Super Admin' }] : []),
                ]}
                fullWidth
              />
              
              <Select
                label="Office"
                name="officeId"
                value={formData.officeId}
                onChange={handleInputChange}
                options={
                  offices?.map(office => ({ value: office.id, label: office.name })) || 
                  [{ value: '1', label: 'Office 1' }]
                }
                fullWidth
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Add Member
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: colors.card }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Edit Team Member
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={formErrors.name}
                fullWidth
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
                fullWidth
              />
              
              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'admin', label: 'Admin' },
                  ...(currentUser?.role === 'super_admin' ? [{ value: 'super_admin', label: 'Super Admin' }] : []),
                ]}
                fullWidth
              />
              
              <Select
                label="Office"
                name="officeId"
                value={formData.officeId}
                onChange={handleInputChange}
                options={
                  offices?.map(office => ({ value: office.id, label: office.name })) || 
                  [{ value: '1', label: 'Office 1' }]
                }
                fullWidth
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;