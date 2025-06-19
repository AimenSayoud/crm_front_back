'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import SearchFilterBar, { ViewMode, FilterState } from './components/SearchFilterBar';
import CandidatesCard, { Candidate } from './components/CandidatesCard';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api/config';

const CandidatesPage = () => {
  const { colors } = useTheme();

  // State for SearchFilterBar
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    experience: [],
    skills: []
  });
  
  // Calculate filter count
  const filterCount = filters.status.length + filters.experience.length + filters.skills.length;

  // State for candidates from database
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Fetch candidates from the backend
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/candidates`, {
        params: {
          page: 1,
          page_size: 50
        }
      });

      // Transform the backend data to match our frontend Candidate interface
      const transformedCandidates = response.data.candidates.map((candidate: any) => ({
        id: candidate._id,
        name: `${candidate.user_id?.firstName || ''} ${candidate.user_id?.lastName || ''}`.trim() || 'Unknown',
        email: candidate.user_id?.email || '',
        phone: candidate.phone || 'N/A',
        location: candidate.location || 'Not specified',
        position: candidate.work_experience?.[0]?.position || 'Not specified',
        experience: `${candidate.years_of_experience || 0}+ years`,
        skills: candidate.skills?.map((s: any) => s.skill_id?.name || '').filter(Boolean) || [],
        status: 'Applied', // Default status since it's not in the backend model
        appliedDate: new Date(candidate.created_at).toLocaleDateString(),
        salary: candidate.job_preferences?.desired_salary_min 
          ? `$${candidate.job_preferences.desired_salary_min.toLocaleString()}`
          : 'Not specified',
        rating: 4, // Default rating
      }));

      setCandidates(transformedCandidates);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on search term and filters
  const filteredCandidates = candidates.filter(candidate => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(candidate.status);

    // Experience filter - simplified matching
    const matchesExperience = filters.experience.length === 0 || 
      filters.experience.some(exp => {
        if (exp === 'Entry Level') return candidate.experience.includes('1') || candidate.experience.includes('2');
        if (exp === 'Mid Level') return candidate.experience.includes('3') || candidate.experience.includes('4');
        if (exp === 'Senior') return candidate.experience.includes('5') || candidate.experience.includes('6');
        if (exp === 'Lead') return candidate.experience.includes('7') || candidate.experience.includes('8') || candidate.experience.includes('9');
        return true;
      });

    // Skills filter
    const matchesSkills = filters.skills.length === 0 || 
      filters.skills.some(skill => candidate.skills.some(candidateSkill => 
        candidateSkill.toLowerCase().includes(skill.toLowerCase())
      ));

    return matchesSearch && matchesStatus && matchesExperience && matchesSkills;
  });

  // Handle candidate status update (for drag and drop)
  const handleCandidateUpdate = (candidateId: string, newStatus: string) => {
    setCandidates(prev =>
      prev.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, status: newStatus as Candidate['status'] }
          : candidate
      )
    );
  };

  // State for selected candidate detail
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Handle candidate actions
  const handleCandidateAction = async (candidateId: string, action: 'view' | 'edit' | 'delete') => {
    switch (action) {
      case 'view':
        try {
          setLoadingCandidate(true);
          // Fetch full candidate details from API
          const response = await axios.get(`${API_BASE_URL}/candidates/${candidateId}`);
          setSelectedCandidate(response.data);
          setShowCandidateModal(true);
        } catch (err) {
          console.error('Error fetching candidate details:', err);
          // If API fails, use the basic data we already have
          const candidate = candidates.find(c => c.id === candidateId);
          if (candidate) {
            setSelectedCandidate(candidate);
            setShowCandidateModal(true);
          }
        } finally {
          setLoadingCandidate(false);
        }
        break;
      case 'edit':
        console.log('Edit candidate:', candidateId);
        // TODO: Open candidate edit modal
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this candidate?')) {
          try {
            // TODO: Add API call to delete candidate
            // await axios.delete(`${API_BASE_URL}/candidates/${candidateId}`);
            setCandidates(prev => prev.filter(c => c.id !== candidateId));
          } catch (err) {
            console.error('Error deleting candidate:', err);
          }
        }
        break;
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Handle apply filters (close filter panel)
  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: [],
      experience: [],
      skills: []
    });
  };

  return (
    <div className="pb-6">
      {/* Page header with welcome message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Candidates
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.text, opacity: 0.7 }}>
          Manage and track all candidate applications
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchCandidates}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filterCount={filterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Candidates Cards */}
          <div className="space-y-6">
            <CandidatesCard
              candidates={filteredCandidates}
              viewMode={viewMode}
              onCandidateUpdate={handleCandidateUpdate}
              onCandidateAction={handleCandidateAction}
            />
          </div>

          {/* Results Summary */}
          {(searchTerm || filterCount > 0) && (
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: colors.text, opacity: 0.6 }}>
                Showing {filteredCandidates.length} of {candidates.length} candidates
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
          )}

          {/* No candidates message */}
          {!loading && candidates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No candidates found.</p>
            </div>
          )}
        </>
      )}

      {/* Candidate Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            style={{ backgroundColor: colors.card }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b" style={{ borderColor: colors.border }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                  Candidate Details
                </h2>
                <button
                  onClick={() => {
                    setShowCandidateModal(false);
                    setSelectedCandidate(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingCandidate ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {selectedCandidate.name || `${selectedCandidate.user_id?.firstName} ${selectedCandidate.user_id?.lastName}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {selectedCandidate.email || selectedCandidate.user_id?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {selectedCandidate.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {selectedCandidate.location || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {selectedCandidate.summary && (
                    <div>
                      <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                        Professional Summary
                      </h3>
                      <p className="text-gray-700">{selectedCandidate.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCandidate.skills || []).map((skill: any, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {typeof skill === 'string' ? skill : skill.skill_id?.name || skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  {selectedCandidate.work_experience && selectedCandidate.work_experience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                        Work Experience
                      </h3>
                      <div className="space-y-4">
                        {selectedCandidate.work_experience.map((exp: any, index: number) => (
                          <div key={index} className="border-l-2 border-gray-300 pl-4">
                            <h4 className="font-medium" style={{ color: colors.text }}>
                              {exp.position}
                            </h4>
                            <p className="text-sm text-gray-600">{exp.company_name}</p>
                            <p className="text-sm text-gray-500">
                              {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - 
                              {exp.is_current ? ' Present' : (exp.end_date && new Date(exp.end_date).toLocaleDateString())}
                            </p>
                            {exp.description && (
                              <p className="text-sm mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                        Education
                      </h3>
                      <div className="space-y-4">
                        {selectedCandidate.education.map((edu: any, index: number) => (
                          <div key={index}>
                            <h4 className="font-medium" style={{ color: colors.text }}>
                              {edu.degree} in {edu.field_of_study}
                            </h4>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">
                              {edu.start_date && new Date(edu.start_date).getFullYear()} - 
                              {edu.end_date && new Date(edu.end_date).getFullYear()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job Preferences */}
                  {selectedCandidate.job_preferences && (
                    <div>
                      <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
                        Job Preferences
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedCandidate.job_preferences.desired_salary_min && (
                          <div>
                            <p className="text-sm text-gray-600">Salary Expectation</p>
                            <p className="font-medium" style={{ color: colors.text }}>
                              ${selectedCandidate.job_preferences.desired_salary_min.toLocaleString()} - 
                              ${selectedCandidate.job_preferences.desired_salary_max?.toLocaleString() || 'Open'}
                            </p>
                          </div>
                        )}
                        {selectedCandidate.job_preferences.remote_preference && (
                          <div>
                            <p className="text-sm text-gray-600">Work Preference</p>
                            <p className="font-medium capitalize" style={{ color: colors.text }}>
                              {selectedCandidate.job_preferences.remote_preference}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t" style={{ borderColor: colors.border }}>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCandidateModal(false);
                    setSelectedCandidate(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  style={{ borderColor: colors.border }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage; 