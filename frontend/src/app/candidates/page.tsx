'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import SearchFilterBar, { ViewMode, FilterState } from './components/SearchFilterBar';
import CandidatesCard, { Candidate } from './components/CandidatesCard';

const CandidatesPage = () => {
  const { colors } = useTheme();

  // State for SearchFilterBar
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    experience: [],
    skills: []
  });
  
  // Calculate filter count
  const filterCount = filters.status.length + filters.experience.length + filters.skills.length;

  // Sample candidate data
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      position: 'Senior Frontend Developer',
      experience: '5+ years',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
      status: 'Interview',
      appliedDate: '2 days ago',
      salary: '$95,000',
      rating: 4,
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 987-6543',
      location: 'San Francisco, CA',
      position: 'Full Stack Engineer',
      experience: '3+ years',
      skills: ['Node.js', 'Python', 'React', 'PostgreSQL', 'Docker'],
      status: 'Applied',
      appliedDate: '1 day ago',
      salary: '$85,000',
      rating: 5,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      position: 'UX/UI Designer',
      experience: '4+ years',
      skills: ['Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
      status: 'Offer',
      appliedDate: '5 days ago',
      salary: '$75,000',
      rating: 4,
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '+1 (555) 321-0987',
      location: 'Seattle, WA',
      position: 'Backend Developer',
      experience: '6+ years',
      skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes', 'MongoDB'],
      status: 'Screening',
      appliedDate: '3 days ago',
      salary: '$100,000',
      rating: 5,
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@email.com',
      phone: '+1 (555) 654-3210',
      location: 'Chicago, IL',
      position: 'Product Manager',
      experience: '7+ years',
      skills: ['Product Strategy', 'Agile', 'Analytics', 'User Stories'],
      status: 'Hired',
      appliedDate: '1 week ago',
      salary: '$110,000',
      rating: 5,
    },
    {
      id: '6',
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      phone: '+1 (555) 789-0123',
      location: 'Boston, MA',
      position: 'DevOps Engineer',
      experience: '4+ years',
      skills: ['Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'AWS'],
      status: 'Rejected',
      appliedDate: '2 weeks ago',
      salary: '$90,000',
      rating: 3,
    },
  ]);

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

  // Handle candidate actions
  const handleCandidateAction = (candidateId: string, action: 'view' | 'edit' | 'delete') => {
    const candidate = candidates.find(c => c.id === candidateId);
    switch (action) {
      case 'view':
        console.log('View candidate:', candidate);
        // TODO: Open candidate detail modal
        break;
      case 'edit':
        console.log('Edit candidate:', candidate);
        // TODO: Open candidate edit modal
        break;
      case 'delete':
        console.log('Delete candidate:', candidate);
        // TODO: Show confirmation dialog
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
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
      {searchTerm && (
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: colors.text, opacity: 0.6 }}>
            Showing {filteredCandidates.length} of {candidates.length} candidates
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage; 