'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

export type ViewMode = 'list' | 'cards' | 'kanban';

export interface FilterState {
  status: string[];
  experience: string[];
  skills: string[];
}

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterCount,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const { colors, theme } = useTheme();

  // Sample filter options
  const statusOptions = ['All', 'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
  const experienceOptions = ['Any', 'Entry Level', 'Mid Level', 'Senior', 'Lead'];
  const skillOptions = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'AWS'];

  // Helper functions for filter management
  const handleStatusFilter = (status: string) => {
    if (status === 'All') {
      onFiltersChange({ ...filters, status: [] });
    } else {
      const newStatus = filters.status.includes(status)
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status];
      onFiltersChange({ ...filters, status: newStatus });
    }
  };

  const handleExperienceFilter = (experience: string) => {
    if (experience === 'Any') {
      onFiltersChange({ ...filters, experience: [] });
    } else {
      const newExperience = filters.experience.includes(experience)
        ? filters.experience.filter(e => e !== experience)
        : [...filters.experience, experience];
      onFiltersChange({ ...filters, experience: newExperience });
    }
  };

  const handleSkillFilter = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onFiltersChange({ ...filters, skills: newSkills });
  };

  const isStatusSelected = (status: string) => {
    if (status === 'All') return filters.status.length === 0;
    return filters.status.includes(status);
  };

  const isExperienceSelected = (experience: string) => {
    if (experience === 'Any') return filters.experience.length === 0;
    return filters.experience.includes(experience);
  };

  const isSkillSelected = (skill: string) => {
    return filters.skills.includes(skill);
  };

  return (
    <div 
      className="rounded-xl border shadow-sm overflow-hidden"
      style={{ 
        backgroundColor: colors.card,
        borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
        boxShadow: theme === 'light' 
          ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
      }}
    >
      {/* Main Search Bar */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left side - Search and Filter */}
          <div className="flex items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <FiSearch 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 z-10" 
                style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} 
              />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: colors.card,
                  borderColor: theme === 'light' ? '#D1D5DB' : '#4B5563',
                  color: colors.text,
                }}
              />
            </div>

            {/* Filter Button */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={onToggleFilters}
              className="h-11 px-4 font-medium flex items-center gap-2 flex-shrink-0"
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {filterCount > 0 && (
                <span 
                  className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: showFilters ? 'rgba(255,255,255,0.2)' : colors.primary,
                    color: 'white'
                  }}
                >
                  {filterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Right side - View Mode Toggle */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <span 
              className="text-sm font-medium hidden sm:block"
              style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
            >
              View:
            </span>
            
            <div 
              className="flex items-center p-1 rounded-lg border h-11"
              style={{ 
                backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
                borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
              }}
            >
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 h-9 ${
                  viewMode === 'list'
                    ? 'shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? colors.card : 'transparent',
                  color: viewMode === 'list' ? colors.primary : colors.text,
                  border: viewMode === 'list' ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}` : 'none',
                }}
              >
                List
              </button>
              <button
                onClick={() => onViewModeChange('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 h-9 ${
                  viewMode === 'cards'
                    ? 'shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: viewMode === 'cards' ? colors.card : 'transparent',
                  color: viewMode === 'cards' ? colors.primary : colors.text,
                  border: viewMode === 'cards' ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}` : 'none',
                }}
              >
                Cards
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 h-9 ${
                  viewMode === 'kanban'
                    ? 'shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: viewMode === 'kanban' ? colors.card : 'transparent',
                  color: viewMode === 'kanban' ? colors.primary : colors.text,
                  border: viewMode === 'kanban' ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}` : 'none',
                }}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Filter Sub-bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t"
            style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563' }}
          >
            <div className="p-6 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                  Filter Candidates
                </h3>
                <button
                  onClick={onToggleFilters}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close filters"
                >
                  <FiX className="w-4 h-4" style={{ color: colors.text }} />
                </button>
              </div>

              {/* Filter Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: colors.text }}>
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: isStatusSelected(status) ? colors.primary : 'transparent',
                          color: isStatusSelected(status) ? 'white' : colors.text,
                          borderColor: isStatusSelected(status) ? colors.primary : (theme === 'light' ? '#D1D5DB' : '#4B5563'),
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: colors.text }}>
                    Experience Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {experienceOptions.map((level) => (
                      <button
                        key={level}
                        onClick={() => handleExperienceFilter(level)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: isExperienceSelected(level) ? colors.primary : 'transparent',
                          color: isExperienceSelected(level) ? 'white' : colors.text,
                          borderColor: isExperienceSelected(level) ? colors.primary : (theme === 'light' ? '#D1D5DB' : '#4B5563'),
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: colors.text }}>
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleSkillFilter(skill)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: isSkillSelected(skill) ? colors.primary : 'transparent',
                          color: isSkillSelected(skill) ? 'white' : colors.text,
                          borderColor: isSkillSelected(skill) ? colors.primary : (theme === 'light' ? '#D1D5DB' : '#4B5563'),
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-4 border-t" 
                   style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563' }}>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    {filterCount} filters applied
                  </span>
                  {filterCount > 0 && (
                    <button 
                      onClick={onClearFilters}
                      className="text-sm font-medium hover:underline"
                      style={{ color: colors.primary }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={onToggleFilters}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={onApplyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilterBar; 