// src/app/automation/page.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectCanAccess } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const AutomationPage = () => {
  const { colors } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useAuthStore(selectUser);
  const canAccess = useAuthStore(selectCanAccess);

  // Only admin or higher can access this page
  const hasAccess = canAccess('admin');

  // Card data
  const emailTemplates = [
    {
      id: '1',
      name: 'Candidate Interview Invitation',
      description: 'Sent when scheduling a first interview with a candidate',
      lastUsed: '2 days ago',
      status: 'active',
    },
    {
      id: '2',
      name: 'Candidate Rejection',
      description: 'Sent to candidates who are not moving forward in the process',
      lastUsed: '1 week ago',
      status: 'active',
    },
    {
      id: '3',
      name: 'Client Follow-up',
      description: 'Sent to clients after submitting candidates',
      lastUsed: '3 days ago',
      status: 'active',
    },
  ];

  const workflows = [
    {
      id: '1',
      name: 'New Candidate Processing',
      description: 'Automatically tags and assigns new candidates based on skills',
      triggers: ['New candidate added'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Interview Reminder',
      description: 'Sends reminders to candidates and recruiters before interviews',
      triggers: ['24h before interview'],
      status: 'active',
    },
    {
      id: '3',
      name: 'Client Update',
      description: 'Weekly update to clients about their open positions',
      triggers: ['Every Monday at 9am'],
      status: 'inactive',
    },
  ];

  const notifications = [
    {
      id: '1',
      name: 'New Candidate Alerts',
      description: 'Notify team when a new candidate matches specific criteria',
      channels: ['Email', 'In-app'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Interview Scheduled',
      description: 'Notify recruiters when interviews are scheduled',
      channels: ['Email', 'In-app', 'SMS'],
      status: 'active',
    },
    {
      id: '3',
      name: 'Position Filled',
      description: 'Notify team when a position is successfully filled',
      channels: ['Email', 'In-app'],
      status: 'active',
    },
  ];

  // If user doesn't have admin access
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: `${colors.text}60` }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>Access Restricted</h2>
        <p className="text-center max-w-md" style={{ color: `${colors.text}80` }}>
          You need admin privileges to access the automation settings. Please contact your system administrator for assistance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Automation
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Total Email Templates</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {emailTemplates.length}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Active Workflows</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {workflows.filter(w => w.status === 'active').length}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-sm" style={{ color: `${colors.text}99` }}>Notification Rules</p>
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                {notifications.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Email Templates Section */}
      <Card 
        title="Email Templates" 
        subtitle="Pre-defined email templates for different recruitment stages"
        headerRight={
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            New Template
          </Button>
        }
        className="mb-6"
      >
        <div className="space-y-4">
          {emailTemplates.map(template => (
            <div 
              key={template.id}
              className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium" style={{ color: colors.text }}>{template.name}</h3>
                  <Badge 
                    variant={template.status === 'active' ? 'success' : 'secondary'}
                    className="ml-2"
                  >
                    {template.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm mt-1" style={{ color: `${colors.text}99` }}>{template.description}</p>
                <div className="text-xs mt-2" style={{ color: `${colors.text}60` }}>Last used: {template.lastUsed}</div>
              </div>
              <div className="flex space-x-2 self-end sm:self-center">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Workflows Section */}
      <Card 
        title="Workflows" 
        subtitle="Automated sequences triggered by specific events"
        headerRight={
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            New Workflow
          </Button>
        }
        className="mb-6"
      >
        <div className="space-y-4">
          {workflows.map(workflow => (
            <div 
              key={workflow.id}
              className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium" style={{ color: colors.text }}>{workflow.name}</h3>
                  <Badge 
                    variant={workflow.status === 'active' ? 'success' : 'secondary'}
                    className="ml-2"
                  >
                    {workflow.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm mt-1" style={{ color: `${colors.text}99` }}>{workflow.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {workflow.triggers.map((trigger, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 self-end sm:self-center">
                <Button variant="outline" size="sm">Edit</Button>
                <Button 
                  variant={workflow.status === 'active' ? 'danger' : 'success'} 
                  size="sm"
                >
                  {workflow.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications Section */}
      <Card 
        title="Notification Rules" 
        subtitle="Alert settings for various recruitment events"
        headerRight={
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            New Rule
          </Button>
        }
      >
        <div className="space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ borderColor: colors.border }}
            >
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium" style={{ color: colors.text }}>{notification.name}</h3>
                  <Badge 
                    variant={notification.status === 'active' ? 'success' : 'secondary'}
                    className="ml-2"
                  >
                    {notification.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm mt-1" style={{ color: `${colors.text}99` }}>{notification.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {notification.channels.map((channel, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 self-end sm:self-center">
                <Button variant="outline" size="sm">Edit</Button>
                <Button 
                  variant={notification.status === 'active' ? 'danger' : 'success'} 
                  size="sm"
                >
                  {notification.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AutomationPage;