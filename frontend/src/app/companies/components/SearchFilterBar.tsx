'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { motion } from 'framer-motion';

export type ViewMode = 'list' | 'cards' | 'kanban';

export interface FilterState {
  industry: string[];
  status: string[];
  employees: string[];
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
  industries: string[];
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
  industries,
}) => {
  const { colors, theme } = useTheme();

  // Sample filter options
  const statusOptions = ['All', 'Active', 'Inactive'];
  const employeeOptions = ['Any', '1-10', '11-50', '51-200', '201-500', '500+'];

  // Helper functions for filter management
  const handleIndustryFilter = (industry: string) => {
    if (industry === 'All') {
      onFiltersChange({ ...filters, industry: [] });
    } else {
      const newIndustry = filters.industry.includes(industry)
        ? filters.industry.filter(i => i !== industry)
        : [...filters.industry, industry];
      onFiltersChange({ ...filters, industry: newIndustry });
    }
  };

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

  const handleEmployeesFilter = (employees: string) => {
    if (employees === 'Any') {
      onFiltersChange({ ...filters, employees: [] });
    } else {
      const newEmployees = filters.employees.includes(employees)
        ? filters.employees.filter(e => e !== employees)
        : [...filters.employees, employees];
      onFiltersChange({ ...filters, employees: newEmployees });
    }
  };

  // Helper functions to check if filter is selected
  const isIndustrySelected = (industry: string) => {
    return industry === 'All' ? filters.industry.length === 0 : filters.industry.includes(industry);
  };

  const isStatusSelected = (status: string) => {
    return status === 'All' ? filters.status.length === 0 : filters.status.includes(status);
  };

  const isEmployeesSelected = (employees: string) => {
    return employees === 'Any' ? filters.employees.length === 0 : filters.employees.includes(employees);
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Controls Bar */}
      <div 
        className="rounded-2xl border p-6 backdrop-blur-sm"
        style={{ 
          backgroundColor: colors.card,
          borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
          boxShadow: theme === 'light' 
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Left side - Search and Filter toggle */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-2xl">
            {/* Search Input */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5" 
                    fill="none" 
                    stroke={theme === 'light' ? '#6B7280' : '#9CA3AF'} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full rounded-xl border transition-all duration-200 focus:ring-2"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: theme === 'light' ? '#D1D5DB' : '#4B5563',
                    color: colors.text,
                  }}
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters ? "primary" : "outline"}
              onClick={onToggleFilters}
              className="px-4 h-10 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z" />
              </svg>
              <span>Filters</span>
              {filterCount > 0 && (
                <span 
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: 'white'
                  }}
                >
                  {filterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Right side - View Mode Switcher */}
          <div className="flex items-center lg:justify-end">
            <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: theme === 'light' ? '#D1D5DB' : '#4B5563' }}>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  viewMode === 'list' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
                  color: viewMode === 'list' ? 'white' : colors.text,
                }}
                title="List View"
                aria-label="Switch to list view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('cards')}
                className={`px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  viewMode === 'cards' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'cards' ? colors.primary : 'transparent',
                  color: viewMode === 'cards' ? 'white' : colors.text,
                }}
                title="Cards View"
                aria-label="Switch to cards view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  viewMode === 'kanban' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'kanban' ? colors.primary : 'transparent',
                  color: viewMode === 'kanban' ? 'white' : colors.text,
                }}
                title="Kanban View"
                aria-label="Switch to kanban view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border p-6"
          style={{ 
            backgroundColor: colors.card,
            borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
            boxShadow: theme === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
          }}
        >
          <div className="space-y-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Advanced Filters
              </h3>
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

            {/* Filter Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Industry Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>
                  Industry
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['All', ...industries].map((industry) => (
                    <button
                      key={industry}
                      onClick={() => handleIndustryFilter(industry)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: isIndustrySelected(industry) ? colors.primary : 'transparent',
                        color: isIndustrySelected(industry) ? 'white' : colors.text,
                        borderColor: isIndustrySelected(industry) ? colors.primary : (theme === 'light' ? '#D1D5DB' : '#4B5563'),
                      }}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>
                  Status
                </h4>
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

              {/* Employee Count Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>
                  Company Size
                </h4>
                <div className="flex flex-wrap gap-2">
                  {employeeOptions.map((employees) => (
                    <button
                      key={employees}
                      onClick={() => handleEmployeesFilter(employees)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: isEmployeesSelected(employees) ? colors.primary : 'transparent',
                        color: isEmployeesSelected(employees) ? 'white' : colors.text,
                        borderColor: isEmployeesSelected(employees) ? colors.primary : (theme === 'light' ? '#D1D5DB' : '#4B5563'),
                      }}
                    >
                      {employees}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563' }}>
              <div className="text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                {filterCount > 0 ? `${filterCount} filter${filterCount > 1 ? 's' : ''} applied` : 'No filters applied'}
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
    </div>
  );
};

export default SearchFilterBar; 