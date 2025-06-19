// src/components/auth/withRoleAccess.tsx
import React, { ComponentType } from 'react';
import { useAuthStore, selectCanAccess } from '@/store/useAuthStore';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';

type WithRoleAccessProps = {
  requiredRole: 'super_admin' | 'admin' | 'employee' | 'candidate' | 'consultant' | 'employer';
};

export function withRoleAccess<P extends object>(
  Component: ComponentType<P>,
  requiredRole: WithRoleAccessProps['requiredRole']
) {
  const WithRoleAccess: React.FC<P> = (props) => {
    const canAccess = useAuthStore(selectCanAccess);
    const { colors } = useTheme();
    
    const hasAccess = canAccess(requiredRole);
    
    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: `${colors.text}60` }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>Access Restricted</h2>
          <p className="text-center max-w-md mb-4" style={{ color: `${colors.text}80` }}>
            You need {requiredRole.replace('_', ' ')} privileges to access this page. Please contact your system administrator for assistance.
          </p>
          <Button 
            variant="primary" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  
  return WithRoleAccess;
}

// Example usage:
// const AdminOnlyPage = withRoleAccess(SettingsPage, 'admin');