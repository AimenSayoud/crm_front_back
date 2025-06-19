'use client';

import React from 'react';

interface MockDataBannerProps {
  entityType?: string;
  count?: number;
}

export default function MockDataBanner({ entityType = 'data', count }: MockDataBannerProps) {
  // Only show in development when mock data is enabled
  const showBanner = process.env.NODE_ENV === 'development' || 
                    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl" role="img" aria-label="Mock data indicator">🎭</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Mock Data Mode Active
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Using mock {entityType} for development
            {count && ` (${count} ${entityType === 'data' ? 'items' : entityType})`}
            . Real API calls are disabled.
          </p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Dev Mode
          </span>
        </div>
      </div>
    </div>
  );
} 