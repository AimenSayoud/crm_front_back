// src/app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectCanAccess } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';

// Form validation utility
const validateRequired = (value: string): string => {
  return value.trim() ? '' : 'This field is required';
};

const validateEmail = (email: string): string => {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? '' : 'Invalid email format';
};

const validatePassword = (password: string): string => {
  if (!password) return '';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
};

const SettingsPage = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const currentUser = useAuthStore(selectUser);
  const canAccess = useAuthStore(selectCanAccess);
  
  // Determine which tabs user can access
  const isAdmin = canAccess('admin');
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [companyForm, setCompanyForm] = useState({
    companyName: 'RecrutementPlus',
    address: '123 Recruitment St, Business District',
    website: 'https://recrutementplus.com',
    phone: '+1 (555) 123-4567',
    email: 'contact@recrutementplus.com',
    description: 'Leading recruitment solutions for top companies worldwide.',
  });
  
  const [systemForm, setSystemForm] = useState({
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'UTC',
    language: 'en',
    defaultCurrency: 'USD',
  });
  
  // Error states
  const [profileErrors, setProfileErrors] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Handle form input change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (profileErrors[name as keyof typeof profileErrors]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSystemForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Validate profile form
  const validateProfileForm = (): boolean => {
    const errors = {
      name: validateRequired(profileForm.name),
      email: validateEmail(profileForm.email),
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    
    // Only validate password if any password field is filled
    if (profileForm.newPassword || profileForm.confirmPassword) {
      errors.currentPassword = validateRequired(profileForm.currentPassword);
      errors.newPassword = validatePassword(profileForm.newPassword);
      
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setProfileErrors(errors);
    return !Object.values(errors).some(error => error);
  };
  
  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateProfileForm()) {
      // In a real app, this would call an API to update the profile
      console.log('Profile form submitted:', profileForm);
      
      // Reset password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
  };
  
  // Handle company form submission
  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to update company settings
    console.log('Company form submitted:', companyForm);
  };
  
  // Handle system form submission
  const handleSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to update system settings
    console.log('System form submitted:', systemForm);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'profile' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={{ 
                  backgroundColor: activeTab === 'profile' ? `${colors.primary}20` : undefined,
                  color: activeTab === 'profile' ? colors.primary : colors.text
                }}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'appearance' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={{ 
                  backgroundColor: activeTab === 'appearance' ? `${colors.primary}20` : undefined,
                  color: activeTab === 'appearance' ? colors.primary : colors.text
                }}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Appearance
                </div>
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('company')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'company' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === 'company' ? `${colors.primary}20` : undefined,
                    color: activeTab === 'company' ? colors.primary : colors.text
                  }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company
                  </div>
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('system')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'system' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === 'system' ? `${colors.primary}20` : undefined,
                    color: activeTab === 'system' ? colors.primary : colors.text
                  }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System
                  </div>
                </button>
              )}
              
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'security' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === 'security' ? `${colors.primary}20` : undefined,
                    color: activeTab === 'security' ? colors.primary : colors.text
                  }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </div>
                </button>
              )}
            </div>
          </Card>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card title="Profile Settings" subtitle="Update your personal information">
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    error={profileErrors.name}
                    fullWidth
                  />
                  
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    error={profileErrors.email}
                    fullWidth
                  />
                  
                  <div className="border-t pt-4 mt-6" style={{ borderColor: colors.border }}>
                    <h3 className="text-md font-medium mb-4" style={{ color: colors.text }}>
                      Change Password
                    </h3>
                    
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={handleProfileChange}
                      error={profileErrors.currentPassword}
                      fullWidth
                    />
                    
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={handleProfileChange}
                      error={profileErrors.newPassword}
                      helperText="At least 8 characters"
                      fullWidth
                    />
                    
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileChange}
                      error={profileErrors.confirmPassword}
                      fullWidth
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
          
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card title="Appearance Settings" subtitle="Customize the visual appearance of the application">
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-4" style={{ color: colors.text }}>
                    Theme
                  </h3>
                  
                  <div className="flex space-x-4">
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        theme === 'light' ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{ 
                        borderColor: colors.border,
                        outline: colors.primary
                      }}
                      onClick={() => theme !== 'light' && toggleTheme()}
                    >
                      <div className="bg-white rounded-md border p-4 mb-3" style={{ borderColor: '#E5E7EB' }}>
                        <div className="h-2 bg-blue-500 rounded mb-2 w-12"></div>
                        <div className="h-2 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="text-center font-medium" style={{ color: colors.text }}>Light</div>
                    </div>
                    
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        theme === 'dark' ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{ 
                        borderColor: colors.border,
                        outline: colors.primary
                      }}
                      onClick={() => theme !== 'dark' && toggleTheme()}
                    >
                      <div className="bg-gray-800 rounded-md border p-4 mb-3" style={{ borderColor: '#4B5563' }}>
                        <div className="h-2 bg-blue-500 rounded mb-2 w-12"></div>
                        <div className="h-2 bg-gray-600 rounded mb-2"></div>
                        <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                      </div>
                      <div className="text-center font-medium" style={{ color: colors.text }}>Dark</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-4" style={{ color: colors.text }}>
                    Density
                  </h3>
                  
                  <div className="flex space-x-4">
                    <div
                      className="border rounded-lg p-4 cursor-pointer transition-colors ring-2 ring-offset-2"
                      style={{ 
                        borderColor: colors.border,
                        outline: colors.primary
                      }}
                    >
                      <div className="text-center font-medium mb-2" style={{ color: colors.text }}>Comfortable</div>
                      <div className="flex flex-col space-y-3">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    
                    <div
                      className="border rounded-lg p-4 cursor-pointer transition-colors"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="text-center font-medium mb-2" style={{ color: colors.text }}>Compact</div>
                      <div className="flex flex-col space-y-1">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button variant="primary">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Company Settings */}
          {activeTab === 'company' && isAdmin && (
            <Card title="Company Settings" subtitle="Update your organization information">
              <form onSubmit={handleCompanySubmit}>
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    name="companyName"
                    value={companyForm.companyName}
                    onChange={handleCompanyChange}
                    fullWidth
                  />
                  
                  <Input
                    label="Website"
                    name="website"
                    value={companyForm.website}
                    onChange={handleCompanyChange}
                    fullWidth
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone"
                      name="phone"
                      value={companyForm.phone}
                      onChange={handleCompanyChange}
                      fullWidth
                    />
                    
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={companyForm.email}
                      onChange={handleCompanyChange}
                      fullWidth
                    />
                  </div>
                  
                  <Input
                    label="Address"
                    name="address"
                    value={companyForm.address}
                    onChange={handleCompanyChange}
                    fullWidth
                  />
                  
                  <TextArea
                    label="Company Description"
                    name="description"
                    value={companyForm.description}
                    onChange={handleCompanyChange}
                    rows={4}
                    fullWidth
                  />
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary">
                      Save Company Info
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
          
          {/* System Settings */}
          {activeTab === 'system' && isAdmin && (
            <Card title="System Settings" subtitle="Configure general application settings">
              <form onSubmit={handleSystemSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Date Format"
                      name="dateFormat"
                      value={systemForm.dateFormat}
                      onChange={handleSystemChange}
                      options={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      ]}
                      fullWidth
                    />
                    
                    <Select
                      label="Time Format"
                      name="timeFormat"
                      value={systemForm.timeFormat}
                      onChange={handleSystemChange}
                      options={[
                        { value: '12h', label: '12 Hour (AM/PM)' },
                        { value: '24h', label: '24 Hour' },
                      ]}
                      fullWidth
                    />
                  </div>
                  
                  <Select
                    label="Timezone"
                    name="timezone"
                    value={systemForm.timezone}
                    onChange={handleSystemChange}
                    options={[
                      { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                      { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
                      { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
                      { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
                      { value: 'Europe/London', label: 'London (GMT)' },
                      { value: 'Europe/Paris', label: 'Paris, Berlin, Rome (CET)' },
                    ]}
                    fullWidth
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Language"
                      name="language"
                      value={systemForm.language}
                      onChange={handleSystemChange}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'fr', label: 'French' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'de', label: 'German' },
                      ]}
                      fullWidth
                    />
                    
                    <Select
                      label="Default Currency"
                      name="defaultCurrency"
                      value={systemForm.defaultCurrency}
                      onChange={handleSystemChange}
                      options={[
                        { value: 'USD', label: 'USD - US Dollar' },
                        { value: 'EUR', label: 'EUR - Euro' },
                        { value: 'GBP', label: 'GBP - British Pound' },
                        { value: 'CAD', label: 'CAD - Canadian Dollar' },
                        { value: 'AUD', label: 'AUD - Australian Dollar' },
                      ]}
                      fullWidth
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary">
                      Save System Settings
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
          
          {/* Security Settings */}
          {activeTab === 'security' && isSuperAdmin && (
            <Card title="Security Settings" subtitle="Configure security options for the application">
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-3" style={{ color: colors.text }}>
                    Password Policy
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="minLength"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="minLength" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Minimum password length: 8 characters
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="upperCase"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="upperCase" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Require at least one uppercase letter
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="numbers"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="numbers" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Require at least one number
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="specialChar"
                        checked={false}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="specialChar" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Require at least one special character
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="passwordExpiry"
                        checked={false}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="passwordExpiry" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Password expires after 90 days
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3" style={{ color: colors.text }}>
                    Login Security
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="twoFactor"
                        checked={false}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="twoFactor" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Require two-factor authentication for all users
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sessionTimeout"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="sessionTimeout" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Session timeout after 30 minutes of inactivity
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="lockoutPolicy"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="lockoutPolicy" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Account lockout after 5 failed login attempts
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3" style={{ color: colors.text }}>
                    Data Security
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dataMasking"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="dataMasking" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Mask sensitive data in reports and exports
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dataEncryption"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="dataEncryption" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Enable data encryption for all stored data
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auditLog"
                        checked={true}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <label htmlFor="auditLog" className="ml-2 text-sm" style={{ color: colors.text }}>
                        Enable audit logging for all user actions
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button variant="primary">
                    Save Security Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;