'use client';

import React, { useEffect } from 'react';
import { useMockCandidateStore, selectMockCandidates, selectMockIsLoading } from '@/store/useMockCandidateStore';

export default function MockCandidatesList() {
  const candidates = useMockCandidateStore(selectMockCandidates);
  const isLoading = useMockCandidateStore(selectMockIsLoading);
  const fetchCandidates = useMockCandidateStore(state => state.fetchCandidates);

  useEffect(() => {
    console.log('🎭 MockCandidatesList: Fetching mock candidates...');
    fetchCandidates();
  }, [fetchCandidates]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800">🎭 Loading mock candidates...</p>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h3 className="text-green-800 font-medium">🎭 Mock Data Active!</h3>
        <p className="text-green-600 text-sm">
          Displaying {candidates.length} mock candidates. Check console for logs.
        </p>
      </div>
      
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Candidate #{candidate.id}</h3>
                <p className="text-sm text-gray-600 mt-1">{candidate.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    candidate.career_level === 'senior' ? 'bg-green-100 text-green-800' :
                    candidate.career_level === 'mid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {candidate.career_level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {candidate.years_of_experience} years exp
                  </span>
                  <span className="text-xs text-gray-500">
                    {candidate.profile_completion}% complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 