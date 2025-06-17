// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectLogin, selectIsLoading } from '@/store/useAuthStore';
import { useTheme } from '@/app/context/ThemeContext';
import { AuthenticationError } from '@/services/api/auth-service';

export default function LoginPage() {
  // Create state for form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Create state for errors
  const [localError, setLocalError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorType, setErrorType] = useState<'validation' | 'auth' | 'server' | ''>('');
  
  // Force re-render counter
  const [renderKey, setRenderKey] = useState(0);
  
  // Get auth store functions
  const login = useAuthStore(selectLogin);
  const isLoading = useAuthStore(selectIsLoading);
  
  // Theme and router
  const { colors } = useTheme();
  const router = useRouter();
  
  // Prevent any default form submissions
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('submit', preventDefault, true);
    
    return () => {
      document.removeEventListener('submit', preventDefault, true);
    };
  }, []);
  
  // Handle login click
  const handleLogin = async () => {
    // Clear previous errors
    setLocalError('');
    setEmailError('');
    setPasswordError('');
    setErrorType('');
    
    // Input validation
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      setErrorType('validation');
      setRenderKey(prev => prev + 1);
      return;
    }
    
    if (!password) {
      setPasswordError('Please enter your password');
      setErrorType('validation');
      setRenderKey(prev => prev + 1);
      return;
    }
    
    try {
      // Attempt login
      await login(email, password);
      // Navigate on success
      router.push('/dashboard');
    } catch (error) {
      // Process error
      if (error instanceof AuthenticationError) {
        const { code, message, details } = error;
        
        if (code === 'invalid_credentials') {
          setLocalError('The email or password you entered is incorrect. Please try again.');
          setErrorType('auth');
        } else if (code === 'user_not_found') {
          setEmailError('This email is not registered in our system');
          setErrorType('validation');
        } else if (code === 'account_disabled') {
          setLocalError('Your account has been deactivated. Please contact support.');
          setErrorType('auth');
        } else if (code === 'validation_error' && details) {
          if (details.email) {
            setEmailError(Array.isArray(details.email) ? details.email[0] : details.email);
          }
          if (details.password) {
            setPasswordError(Array.isArray(details.password) ? details.password[0] : details.password);
          }
          setErrorType('validation');
        } else if (code === 'rate_limited') {
          setLocalError('Too many login attempts. Please try again later.');
          setErrorType('server');
        } else {
          setLocalError(message || 'An unexpected error occurred');
          setErrorType('auth');
        }
      } else if (error instanceof Error) {
        if (error.name === 'NetworkConnectionError' || 
            error.message.toLowerCase().includes('network') || 
            error.message.includes('failed to fetch')) {
          setLocalError('Unable to connect to the server. Please check your connection and that the backend is running.');
          setErrorType('server');
        } else {
          setLocalError(error.message || 'Authentication failed');
          setErrorType('auth');
        }
      } else {
        setLocalError('Authentication failed. Please check your credentials and try again.');
        setErrorType('auth');
      }
      
      // Force re-render after error
      setRenderKey(prev => prev + 1);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
      key={`login-container-${renderKey}`}
    >
      <div 
        className="max-w-md w-full p-8 rounded-lg shadow-lg"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>RecrutementPlus</h1>
          <p className="text-sm mt-2 opacity-75" style={{ color: colors.text }}>Log in to your CRM account</p>
        </div>
        
        {/* Error message container */}
        {localError && (
          <div 
            className={`mb-4 p-3 rounded-md text-sm font-medium ${
              errorType === 'server' 
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-red-100 text-red-600 border border-red-300'
            }`}
          >
            {localError}
          </div>
        )}
        
        {/* Login form (not using form element) */}
        <div>
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className={`block text-sm font-medium mb-1 ${emailError ? 'text-red-500' : ''}`}
              style={{ color: emailError ? '#ef4444' : colors.text }}
            >
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  emailError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                style={{ 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: emailError ? '#ef4444' : colors.border,
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                autoComplete="username"
                name="email"
              />
              {emailError && (
                <span className="absolute right-2 top-2 text-red-500">
                  ⚠️
                </span>
              )}
            </div>
            {emailError ? (
              <p id="email-error" className="mt-1 text-xs text-red-500">
                {emailError}
              </p>
            ) : (
              <p className="mt-1 text-xs opacity-75" style={{ color: colors.text }}>
                Enter your registered email address
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <label 
              htmlFor="password" 
              className={`block text-sm font-medium mb-1 ${passwordError ? 'text-red-500' : ''}`}
              style={{ color: passwordError ? '#ef4444' : colors.text }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  passwordError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                style={{ 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: passwordError ? '#ef4444' : colors.border,
                }}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                autoComplete="current-password"
                name="password"
              />
              {passwordError && (
                <span className="absolute right-2 top-2 text-red-500">
                  ⚠️
                </span>
              )}
            </div>
            {passwordError ? (
              <p id="password-error" className="mt-1 text-xs text-red-500">
                {passwordError}
              </p>
            ) : (
              <p className="mt-1 text-xs opacity-75" style={{ color: colors.text }}>
                Enter your account password
              </p>
            )}
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); 
              if (!isLoading) handleLogin();
            }}
            disabled={isLoading}
            className={`w-full py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center ${
              errorType ? 'hover:bg-blue-700' : 'hover:bg-blue-600'
            }`}
            style={{ 
              backgroundColor: errorType === 'server' ? '#f59e0b' : colors.primary,
              color: 'white',
              minHeight: '42px'
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}