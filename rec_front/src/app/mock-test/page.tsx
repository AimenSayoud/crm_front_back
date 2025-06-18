'use client';

import React from 'react';
import MockCandidatesList from '@/components/candidates/MockCandidatesList';

export default function MockTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900">Mock Data Test</h1>
            <p className="text-gray-600 mt-1">Testing the mock candidate data system</p>
          </div>
          <MockCandidatesList />
        </div>
      </div>
    </div>
  );
} 