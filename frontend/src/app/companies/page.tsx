// src/app/companies/page.tsx (enhanced version)
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

import { motion } from 'framer-motion';
import { Company } from '@/types';
import SearchFilterBar, { ViewMode, FilterState } from './components/SearchFilterBar';
import CompaniesCard from './components/CompaniesCard';
import CompanyDetailModal from '@/components/companies/CompanyDetailModal';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api/config';

const CompaniesPage = () => {
  const { colors, theme } = useTheme();

  // State for SearchFilterBar
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    industry: [],
    status: [],
    employees: []
  });
  
  // Calculate filter count
  const filterCount = filters.industry.length + filters.status.length + filters.employees.length;

  // Company state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load companies from MongoDB
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching companies from MongoDB...');
      
      const response = await axios.get(`${API_BASE_URL}/companies`, {
        params: {
          page: 1,
          page_size: 50
        }
      });

      // Transform the backend data to match our frontend Company interface
      const transformedCompanies = response.data.companies.map((company: any) => ({
        id: company._id,
        name: company.name || 'Unknown Company',
        industry: company.industry || 'Not specified',
        website: company.website || '',
        contactPerson: company.contact_person || 'Not specified',
        contactEmail: company.email || '',
        contactPhone: company.phone || '',
        address: company.address || 'Not specified',
        notes: company.description || '',
        createdAt: new Date(company.created_at),
        updatedAt: new Date(company.updated_at),
        openPositions: company.active_jobs || 0,
        officeId: 'default-office',
      })) as Company[];
      
      setCompanies(transformedCompanies);
      console.log(`Loaded ${transformedCompanies.length} companies from database`);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setCompanies([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique industries for filter
  const uniqueIndustries = useMemo(() => {
    return companies
      ? Array.from(new Set(companies.map(c => c.industry))).sort()
      : [];
  }, [companies]);

  // Filter companies based on search term and filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      // Industry filter
      const matchesIndustry = filters.industry.length === 0 || filters.industry.includes(company.industry);

      // Status filter
      const matchesStatus = filters.status.length === 0 || 
        (filters.status.includes('Active') && company.openPositions > 0) ||
        (filters.status.includes('Inactive') && company.openPositions === 0);

      // Employee count filter
      const matchesEmployees = filters.employees.length === 0 || filters.employees.some(range => {
        const employees = 50; // Default employee count since Company type doesn't have total_employees
        switch (range) {
          case '1-10': return employees >= 1 && employees <= 10;
          case '11-50': return employees >= 11 && employees <= 50;
          case '51-200': return employees >= 51 && employees <= 200;
          case '201-500': return employees >= 201 && employees <= 500;
          case '500+': return employees > 500;
          default: return true;
        }
      });

      return matchesSearch && matchesIndustry && matchesStatus && matchesEmployees;
    });
  }, [companies, searchTerm, filters]);

  // Handle filter callbacks
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    // Filters are automatically applied through filteredCompanies memo
  };

  const handleClearFilters = () => {
    setFilters({
      industry: [],
      status: [],
      employees: []
    });
  };

  // Handle company actions
  const handleCompanyAction = (companyId: string, action: 'view' | 'edit' | 'delete') => {
    const company = companies.find(c => c.id === companyId);
    switch (action) {
      case 'view':
        console.log('View company:', company);
        setSelectedCompany(company || null);
        setShowDetailModal(true);
        break;
      case 'edit':
        console.log('Edit company:', company);
        // TODO: Open company edit modal
        break;
      case 'delete':
        console.log('Delete company:', company);
        // TODO: Show confirmation dialog
        setCompanies(prev => prev.filter(c => c.id !== companyId));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-2xl font-bold" 
            style={{ color: colors.text }}
          >
            Companies
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="text-sm mt-1"
            style={{ color: colors.text }}
          >
            Manage your client companies and partnerships
          </motion.p>
        </div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center space-x-6 text-sm"
        >
          <div className="text-center">
            <div className="font-semibold text-lg" style={{ color: colors.text }}>
              {companies.length}
            </div>
            <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              Total Companies
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg" style={{ color: colors.primary }}>
              {companies.filter(c => c.openPositions > 0).length}
            </div>
            <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              Active
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg" style={{ color: colors.text }}>
              {companies.reduce((sum, c) => sum + c.openPositions, 0)}
            </div>
            <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              Open Positions
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
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
          industries={uniqueIndustries}
        />
      </motion.div>

      {/* Results Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex justify-between items-center"
      >
        <p className="text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
          {isLoading ? 'Loading companies...' : `Showing ${filteredCompanies.length} ${filteredCompanies.length === 1 ? 'company' : 'companies'}`}
          {searchTerm && ` matching "${searchTerm}"`}
          {filterCount > 0 && ` with ${filterCount} filter${filterCount > 1 ? 's' : ''} applied`}
        </p>
      </motion.div>

      {/* Companies Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <motion.div 
                className="relative w-16 h-16 mb-4"
              >
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    border: `3px solid ${colors.primary}20`,
                    borderTopColor: colors.primary 
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
              <p style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Loading companies...</p>
            </div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <svg className="w-8 h-8" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
              No companies found
            </h3>
            <p className="text-sm text-center max-w-md" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              {searchTerm || filterCount > 0 
                ? 'Try adjusting your search or filters to find companies.'
                : 'Get started by adding your first company to the system.'}
            </p>
            {(searchTerm || filterCount > 0) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleClearFilters();
                }}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}30`
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <CompaniesCard
            companies={filteredCompanies}
            viewMode={viewMode}
            onCompanyAction={handleCompanyAction}
          />
        )}
      </motion.div>

      {/* Company Detail Modal */}
      {showDetailModal && selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCompany(null);
          }}
          onSave={(updatedCompany) => {
            setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
            setShowDetailModal(false);
            setSelectedCompany(null);
          }}
        />
      )}
    </div>
  );
};

export default CompaniesPage;