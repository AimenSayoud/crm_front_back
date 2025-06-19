// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectLogin, selectIsLoading } from '@/store/useAuthStore';
import { useTheme } from '@/app/context/ThemeContext';
import { AuthenticationError } from '@/services/api/auth-service';
import { BackgroundCells } from '@/components/ui/background-ripple-effect';
import Image from 'next/image';

export default function LoginPage() {
  // Create state for form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Create state for errors
  const [localError, setLocalError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorType, setErrorType] = useState<'validation' | 'auth' | 'server' | ''>('');
  const [showAlert, setShowAlert] = useState(false);
  
  // Force re-render counter
  const [renderKey, setRenderKey] = useState(0);
  
  // Get auth store functions
  const login = useAuthStore(selectLogin);
  const isLoading = useAuthStore(selectIsLoading);
  
  // Router and theme
  const router = useRouter();
  const { theme } = useTheme();
  
  // Use light theme colors specifically for login
  const lightColors = {
    primary: '#0F766E', // teal-700 for focused/active
    secondary: '#031F28', // custom dark primary as secondary in light
    background: '#F9FAFB', // gray-50
    text: '#1F2937', // gray-800
    sidebar: '#E6F1F4', // light blueish sidebar
    card: '#FFFFFF', // white
    border: '#E5E7EB', // gray-200
    inputBg: '#F9FAFB', // same as background
    shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };
  
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

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showAlert]);
  
  // Handle login click
  const handleLogin = async () => {
    // Clear previous errors
    setLocalError('');
    setEmailError('');
    setPasswordError('');
    setErrorType('');
    setShowAlert(false);
    
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
          setShowAlert(true);
        } else if (code === 'user_not_found') {
          setEmailError('This email is not registered in our system');
          setErrorType('validation');
        } else if (code === 'account_disabled') {
          setLocalError('Your account has been deactivated. Please contact support.');
          setErrorType('auth');
          setShowAlert(true);
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
          setShowAlert(true);
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
          setShowAlert(true);
        }
      } else {
        setLocalError('Authentication failed. Please check your credentials and try again.');
        setErrorType('auth');
        setShowAlert(true);
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
    <div key={`login-container-${renderKey}`}>
      <BackgroundCells className="flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#031F28' }}>
        <div className="pointer-events-auto z-50 w-full max-w-md relative">
          
          <div 
            className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header Section */}
            <div className="px-12 pt-8 pb-6 text-center">
              <div className="mb-6">
                <Image 
                  src="/logo.png" 
                  alt="RecrutementPlus Logo" 
                  width={140} 
                  height={140}
                  className={`mx-auto object-contain transition-all duration-300 ${isLoading ? 'animate-pulse scale-110' : ''}`}
                />
              </div>
              <h1 
                className="text-3xl font-bold mb-2 tracking-tight" 
                style={{ color: lightColors.secondary }}
              >
                Welcome Back
              </h1>
              <p 
                className="text-sm opacity-70 font-medium" 
                style={{ color: lightColors.secondary }}
              >
                Sign in to access your CRM dashboard
              </p>
            </div>

            {/* Form Section */}
            <div className={`px-8 pb-8 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              
              {/* Alert Section - Inside Form */}
              {showAlert && (
                <div className="mb-6">
                  <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-3 text-red-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-bold text-red-900 text-base">⚠️ Authentication Failed</h4>
                        <p className="text-sm text-red-700 mt-1">Invalid email or password. Please check your credentials and try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Global Error */}
              {localError && (
                <div 
                  className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                    errorType === 'server' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {localError}
                  </div>
                </div>
              )}
              
              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: lightColors.secondary }}
                  >
                    Email Address
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
                      className={`w-full px-4 py-3.5 text-sm rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
                        emailError 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-teal-500'
                      }`}
                      style={{ 
                        backgroundColor: '#fafafa',
                        color: lightColors.secondary,
                        fontSize: '14px'
                      }}
                      placeholder="Enter your email address"
                      aria-invalid={emailError ? "true" : "false"}
                      aria-describedby={emailError ? "email-error" : undefined}
                      autoComplete="username"
                      name="email"
                    />
                    {emailError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {emailError}
                    </p>
                  )}
                </div>
                
                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: lightColors.secondary }}
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
                      className={`w-full px-4 py-3.5 text-sm rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
                        passwordError 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-teal-500'
                      }`}
                      style={{ 
                        backgroundColor: '#fafafa',
                        color: lightColors.secondary,
                        fontSize: '14px'
                      }}
                      placeholder="Enter your password"
                      aria-invalid={passwordError ? "true" : "false"}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      autoComplete="current-password"
                      name="password"
                    />
                    {passwordError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {passwordError}
                    </p>
                  )}
                </div>
                
                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); 
                    if (!isLoading) handleLogin();
                  }}
                  disabled={isLoading}
                  className={`group w-full py-4 px-6 rounded-xl font-semibold text-white text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center ${
                    isLoading 
                      ? 'transform scale-[0.98]' 
                      : 'hover:transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                  }`}
                  style={{ 
                    backgroundColor: lightColors.secondary,
                    boxShadow: isLoading ? 'none' : '0 10px 25px -5px rgba(3, 31, 40, 0.4), 0 4px 10px -2px rgba(3, 31, 40, 0.2)'
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-6 h-6 border-3 border-transparent border-r-white/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}></div>
                      </div>
                      <span className="font-medium">Signing In...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div 
              className="px-8 py-4 text-center border-t border-gray-100"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              <p 
                className="text-xs font-medium opacity-60" 
                style={{ color: lightColors.secondary }}
              >
                RecrutementPlus CRM © 2024 • Secure Login
              </p>
            </div>
          </div>
        </div>
      </BackgroundCells>
    </div>
  );
}