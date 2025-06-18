// Test component to demonstrate mock data usage
'use client';

import React, { useEffect } from 'react';
import { useMockCandidateStore, selectMockCandidates, selectMockIsLoading, selectMockError } from '../../store/useMockCandidateStore';
import { mockData } from '../../store/mockData';

export default function MockDataTest() {
  const candidates = useMockCandidateStore(selectMockCandidates);
  const isLoading = useMockCandidateStore(selectMockIsLoading);
  const error = useMockCandidateStore(selectMockError);
  const fetchCandidates = useMockCandidateStore(state => state.fetchCandidates);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading candidates</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Data Test</h1>
        <p className="text-gray-600">This component demonstrates the mock data system in action.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">Candidates</h3>
          <p className="text-2xl font-bold text-blue-600">{mockData.candidates.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900">Companies</h3>
          <p className="text-2xl font-bold text-green-600">{mockData.companies.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900">Jobs</h3>
          <p className="text-2xl font-bold text-purple-600">{mockData.jobs.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-900">Skills</h3>
          <p className="text-2xl font-bold text-orange-600">{mockData.skills.length}</p>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Candidates ({candidates.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {candidate.user_id.split('_')[1]}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Candidate #{candidate.id}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          candidate.career_level === 'senior' ? 'bg-green-100 text-green-800' :
                          candidate.career_level === 'mid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {candidate.career_level}
                        </span>
                        <span className="text-sm text-gray-500">
                          {candidate.years_of_experience} years experience
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {candidate.summary}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Profile: {candidate.profile_completion}% complete</span>
                    {candidate.linkedin_url && (
                      <a href={candidate.linkedin_url} className="text-blue-600 hover:text-blue-800">
                        LinkedIn
                      </a>
                    )}
                    {candidate.github_url && (
                      <a href={candidate.github_url} className="text-gray-600 hover:text-gray-800">
                        GitHub
                      </a>
                    )}
                    {candidate.portfolio_url && (
                      <a href={candidate.portfolio_url} className="text-purple-600 hover:text-purple-800">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Companies ({mockData.companies.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {mockData.companies.map((company) => (
            <div key={company.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {company.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{company.industry}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{company.company_size} ({company.total_employees} employees)</span>
                      <span>{company.location}</span>
                      <span>{company.active_jobs} active jobs</span>
                      {company.is_verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Jobs ({mockData.jobs.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {mockData.jobs.map((job) => (
            <div key={job.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                    {job.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {job.company_name} • {job.location}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span className="capitalize">{job.contract_type.replace('_', ' ')}</span>
                    <span className="capitalize">{job.experience_level}</span>
                    <span className="capitalize">{job.job_type}</span>
                    {job.salary_min && job.salary_max && (
                      <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{job.application_count} applications</span>
                    <span>{job.view_count} views</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 