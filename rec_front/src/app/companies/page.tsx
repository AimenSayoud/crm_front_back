// src/app/companies/page.tsx (enhanced version)
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
//import Badge from '@/components/ui/Badge';
import CompanyDetailModal from '@/components/companies/CompanyDetailModal';
import { apiService } from '@/lib';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Company, Job } from '@/types';
import { 
  motion, AnimatePresence, useScroll, 
  useSpring, useTransform, 
} from 'framer-motion';
import TextArea from '@/components/ui/TextArea';

// Type for company grouping option
type GroupBy = 'none' | 'industry' | 'status';

// Enhanced CompaniesPage component with premium features
const CompaniesPage = () => {
  const { colors, theme } = useTheme();
  const user = useAuthStore(selectUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'openPositions' | 'dateAdded'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [favoriteCompanies, setFavoriteCompanies] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minJobs: '',
    maxJobs: '',
    dateRange: 'all',
    contactFilter: '',
  });
  const [recentActivity, setRecentActivity] = useState<{id: string, action: string, timestamp: Date}[]>([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isFilterBarSticky, setIsFilterBarSticky] = useState(false);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  
  // Refs for scroll elements
  const filterBarRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  // Framer Motion hooks for animations
  const { scrollY } = useScroll();
  const scrollProgress = useSpring(useTransform(scrollY, [0, 1000], [0, 1]), { stiffness: 300, damping: 30 });
  const filterBarOpacity = useTransform(scrollY, [100, 160], [1, 0.95]);
  const filterBarScale = useTransform(scrollY, [100, 160], [1, 0.98]);
  
  // Handle scroll events for sticky elements
  useEffect(() => {
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsFilterBarSticky(rect.top <= 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCompanies');
    if (savedFavorites) {
      setFavoriteCompanies(JSON.parse(savedFavorites));
    }
    
    // Load recent activity
    const savedActivity = localStorage.getItem('companyActivity');
    if (savedActivity) {
      const parsedActivity = JSON.parse(savedActivity);
      setRecentActivity(parsedActivity.map((item: {id: string; action: string; timestamp: string}) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  // Fetch companies based on user's office access
  const { data: companies, loading, error, refetch } = useApiQuery<Company[]>(
    async () => {
      const res = await apiService.companies.getAll(user?.role === 'super_admin' ? undefined : user?.officeId);
      return res.items;
    },
    [user?.officeId]
  );

  // Fetch jobs to show in company detail modal
  const { data: jobs } = useApiQuery<Job[]>(
    async () => {
      const res = await apiService.jobs.getAll(user?.role === 'super_admin' ? undefined : user?.officeId);
      return res.items;
    },
    [user?.officeId]
  );

  // Get unique industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    return companies
      ? Array.from(new Set(companies.map(c => c.industry))).sort()
      : [];
  }, [companies]);
  
  // Handle toggling company as favorite
  const toggleFavorite = useCallback((companyId: string) => {
    setFavoriteCompanies(prevFavorites => {
      const newFavorites = prevFavorites.includes(companyId)
        ? prevFavorites.filter(id => id !== companyId)
        : [...prevFavorites, companyId];
      
      // Save to localStorage
      localStorage.setItem('favoriteCompanies', JSON.stringify(newFavorites));
      return newFavorites;
    });
    
    // Add to recent activity
    addRecentActivity(companyId, favoriteCompanies.includes(companyId) ? 'removed from favorites' : 'added to favorites');
  }, [favoriteCompanies]);
  
  // Add recent activity
  const addRecentActivity = useCallback((companyId: string, action: string) => {
    const newActivity = {
      id: companyId,
      action,
      timestamp: new Date()
    };
    
    setRecentActivity(prev => {
      const updated = [newActivity, ...prev.slice(0, 9)]; // Keep only 10 most recent
      localStorage.setItem('companyActivity', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // Apply advanced filters
  const applyAdvancedFilters = useCallback((company: Company) => {
    const { minJobs, maxJobs, dateRange, contactFilter } = advancedFilters;
    
    // Filter by min/max jobs
    if (minJobs && company.openPositions < parseInt(minJobs)) return false;
    if (maxJobs && company.openPositions > parseInt(maxJobs)) return false;
    
    // Filter by date range
    if (dateRange !== 'all') {
      const companyDate = new Date(company.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - companyDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === 'last7days' && daysDiff > 7) return false;
      if (dateRange === 'last30days' && daysDiff > 30) return false;
      if (dateRange === 'last90days' && daysDiff > 90) return false;
    }
    
    // Filter by contact info
    if (contactFilter) {
      const contactFilterLower = contactFilter.toLowerCase();
      return (
        company.contactPerson.toLowerCase().includes(contactFilterLower) ||
        (company.contactEmail && company.contactEmail.toLowerCase().includes(contactFilterLower)) ||
        (company.contactPhone && company.contactPhone.toLowerCase().includes(contactFilterLower))
      );
    }
    
    return true;
  }, [advancedFilters]);
  
  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    
    // First, apply search and industry filters
    const filtered = companies.filter(company => {
      // Apply industry filter
      if (industryFilter !== 'all' && company.industry !== industryFilter) return false;
      
      // Apply search
      if (searchTerm && !company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !company.industry.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply advanced filters
      if (showAdvancedFilters && !applyAdvancedFilters(company)) return false;
      
      return true;
    });
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      // First sort favorites to top if any
      if (favoriteCompanies.includes(a.id) && !favoriteCompanies.includes(b.id)) return -1;
      if (!favoriteCompanies.includes(a.id) && favoriteCompanies.includes(b.id)) return 1;
      
      // Then apply selected sort
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } 
      else if (sortBy === 'openPositions') {
        return sortOrder === 'asc'
          ? a.openPositions - b.openPositions
          : b.openPositions - a.openPositions;
      } 
      else { // dateAdded (createdAt)
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [companies, searchTerm, industryFilter, sortBy, sortOrder, showAdvancedFilters, applyAdvancedFilters, favoriteCompanies]);

  // Group companies by the selected grouping option
  const groupedCompanies = useMemo(() => {
    if (groupBy === 'none') return { 'All Companies': filteredCompanies };
    
    return filteredCompanies.reduce((groups, company) => {
      let groupKey = '';
      
      if (groupBy === 'industry') {
        groupKey = company.industry;
      } else if (groupBy === 'status') {
        groupKey = company.openPositions > 0 ? 'Active' : 'Inactive';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(company);
      return groups;
    }, {} as Record<string, Company[]>);
  }, [filteredCompanies, groupBy]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!companies) return { 
      total: 0, 
      openPositions: 0, 
      activeClients: 0,
      averageJobsPerCompany: 0,
      mostCommonIndustry: '',
      recentlyAdded: 0
    };
    
    // Count companies by industry
    const industryCount = companies.reduce<Record<string, number>>((acc, company) => {
      acc[company.industry] = (acc[company.industry] || 0) + 1;
      return acc;
    }, {});
    
    // Find most common industry
    let mostCommonIndustry = '';
    let maxCount = 0;
    Object.entries(industryCount).forEach(([industry, count]) => {
      const countNum = count as number;
      if (countNum > maxCount) {
        mostCommonIndustry = industry;
        maxCount = countNum;
      }
    });
    
    // Count recently added companies (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = companies.filter(
      company => new Date(company.createdAt) >= thirtyDaysAgo
    ).length;
    
    return {
      total: companies.length,
      openPositions: companies.reduce((sum, company) => sum + company.openPositions, 0),
      activeClients: companies.filter(company => company.openPositions > 0).length,
      averageJobsPerCompany: companies.length > 0 
        ? parseFloat((companies.reduce((sum, company) => sum + company.openPositions, 0) / companies.length).toFixed(1))
        : 0,
      mostCommonIndustry,
      recentlyAdded,
      industries: Object.entries(industryCount)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5) // Top 5 industries
    };
  }, [companies]);

  // Toggle sort order when clicking on the same sort option
  const handleSortClick = (sort: 'name' | 'openPositions' | 'dateAdded') => {
    if (sortBy === sort) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sort);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Handle company click
  const handleCompanyClick = (id: string) => {
    // Skip when in selection mode
    if (isSelectionMode) {
      handleCompanySelection(id);
      return;
    }
    
    const company = companies?.find(c => c.id === id) || null;
    setSelectedCompany(company);
    setShowDetailModal(true);
    
    // Add to recent activity
    addRecentActivity(id, 'viewed details');
  };

  // Handle save company from modal
  const handleSaveCompany = async (company: Company) => {
    try {
      if (company.id.startsWith('temp-')) {
        // Create new company
        await apiService.companies.create(company);
        addRecentActivity(company.id, 'created');
      } else {
        // Update existing company
        await apiService.companies.update(company.id, company);
        addRecentActivity(company.id, 'updated');
      }
      
      refetch();
    } catch (error) {
      console.error('Failed to save company:', error);
    }
  };

  // Handle company deletion
  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await apiService.companies.delete(id);
        addRecentActivity(id, 'deleted');
        setFavoriteCompanies(prevFavorites =>
          prevFavorites.filter(companyId => companyId !== id)
        );
        refetch();
      } catch (error) {
        console.error('Failed to delete company:', error);
      }
    }
  };
  
  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCompanies.length} companies?`)) {
      try {
        // Delete each selected company
        await Promise.all(
          selectedCompanies.map(id => apiService.companies.delete(id))
        );
        
        // Update favorites and activity
        selectedCompanies.forEach(id => {
          addRecentActivity(id, 'deleted (bulk)');
          setFavoriteCompanies(prev => prev.filter(companyId => companyId !== id));
        });
        
        // Clear selection and reload data
        setSelectedCompanies([]);
        setIsSelectionMode(false);
        refetch();
      } catch (error) {
        console.error('Failed to delete companies:', error);
      }
    }
  };

  // Handle selection of company in bulk selection mode
  const handleCompanySelection = (id: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(id)) {
        return prev.filter(companyId => companyId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedCompanies([]);
    }
  };

  // Get industry color based on industry name for visual variety
  const getIndustryColor = (industry: string) => {
    // Simple hash function to generate a number from string
    const hash = industry.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate a hue value between 0-360 for HSL color
    const hue = hash % 360;
    
    return {
      bg: theme === 'light' 
        ? `hsla(${hue}, 85%, 93%, 0.8)` 
        : `hsla(${hue}, 70%, 20%, 0.8)`,
      text: theme === 'light' 
        ? `hsl(${hue}, 75%, 35%)` 
        : `hsl(${hue}, 80%, 75%)`,
      border: theme === 'light'
        ? `hsla(${hue}, 75%, 35%, 0.3)`
        : `hsla(${hue}, 80%, 75%, 0.3)`
    };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setIndustryFilter('all');
    setSortBy('dateAdded');
    setSortOrder('desc');
    setShowAdvancedFilters(false);
    setAdvancedFilters({
      minJobs: '',
      maxJobs: '',
      dateRange: 'all',
      contactFilter: '',
    });
  };
  
  // Format date relative to now (e.g. "2 days ago")
  const formatRelativeDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };
  
  // Handle export companies to CSV
  const handleExportCSV = () => {
    if (!companies || companies.length === 0) return;
    
    // Determine which companies to export (filtered or selected)
    const companiesToExport = selectedCompanies.length > 0
      ? companies.filter(c => selectedCompanies.includes(c.id))
      : filteredCompanies;
      
    // Create CSV header
    const headers = ['Company Name', 'Industry', 'Contact Person', 'Contact Email', 'Contact Phone', 'Website', 'Open Positions', 'Date Added'];
    
    // Create CSV rows
    const rows = companiesToExport.map(company => [
      company.name,
      company.industry,
      company.contactPerson,
      company.contactEmail || '',
      company.contactPhone || '',
      company.website || '',
      company.openPositions.toString(),
      new Date(company.createdAt).toLocaleDateString()
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 0 }, // Removed the y-offset to avoid the upward animation
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
        duration: 0.1, // Reduced duration
        when: "beforeChildren", // This ensures parent containers animate before children
        staggerChildren: 0.01 // Significantly reduced stagger time between children
      }
    }
  };
  
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 50,
        damping: 20
      }
    }
  };

  // Handle error state
  if (error) {
    return (
      <motion.div 
        className="p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="p-6 rounded-lg mb-4 flex flex-col items-center"
          style={{ backgroundColor: theme === 'light' ? '#FEE2E2' : '#7F1D1D', color: theme === 'light' ? '#DC2626' : '#FECACA' }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-medium mb-2">Error Loading Companies</h3>
          <p className="mb-4">{error.message}</p>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => refetch()} 
              variant="primary"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Retry
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key="main-content" className="w-full">
        {/* Progress bar at the top of the page */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ 
          scaleX: scrollProgress,
          transformOrigin: '0%', 
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` 
        }}
      />
      
      {/* Floating action button */}
      <motion.div
        className="fixed bottom-8 right-8 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <motion.div 
          className="flex flex-col items-end space-y-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Main action button */}
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white relative overflow-hidden"
            style={{ backgroundColor: colors.primary }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: { 
                opacity: 1, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }
              }
            }}
          >
            <motion.span
              className="absolute inset-0 opacity-30"
              animate={{ 
                background: [
                  `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})`,
                  `linear-gradient(270deg, ${colors.primary}, ${colors.secondary})`,
                  `linear-gradient(0deg, ${colors.primary}, ${colors.secondary})`,
                  `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.button>
          
          {/* Selection mode toggle */}
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white"
            style={{ 
              backgroundColor: isSelectionMode ? colors.secondary : colors.card,
              color: isSelectionMode ? 'white' : colors.text,
              border: isSelectionMode ? 'none' : `1px solid ${colors.border}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSelectionMode}
            variants={{
              hidden: { opacity: 0, scale: 0, x: 20 },
              visible: { 
                opacity: 1, 
                scale: 1,
                x: 0,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </motion.button>
          
          {/* Export button */}
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-white"
            style={{ 
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportModal(true)}
            variants={{
              hidden: { opacity: 0, scale: 0, x: 20 },
              visible: { 
                opacity: 1, 
                scale: 1,
                x: 0,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative"
      >
        {/* Selection mode indicator */}
        {isSelectionMode && (
          <motion.div 
            className="fixed top-16 left-0 right-0 py-2 px-4 z-30 shadow-md flex justify-between items-center"
            style={{ 
              backgroundColor: colors.card,
              borderBottom: `1px solid ${colors.border}`
            }}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <div className="flex items-center">
              <span className="font-medium" style={{ color: colors.text }}>
                {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'} selected
              </span>
            </div>
            <div className="flex gap-2">
              {selectedCompanies.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedCompanies([]);
                  setIsSelectionMode(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      
        {/* Header section */}
        <motion.div 
          className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r relative" 
                style={{ 
                  backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  color: colors.text
                }}>
              Companies
              <motion.span
                className="absolute -top-1 -right-4 text-xs flex items-center justify-center rounded-full px-1.5 py-0.5 font-normal"
                style={{ 
                  backgroundColor: colors.primary,
                  color: 'white'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {stats.total}
              </motion.span>
            </h1>
            <p className="text-sm mt-1" style={{ color: `${colors.text}99` }}>
              Manage your client companies and job listings with ease
            </p>
          </div>
          
          <motion.div
            className="flex flex-wrap gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="primary"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              onClick={() => setShowCreateModal(true)}
            >
              Add Company
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div
          className="mb-6"
          variants={containerVariants}
          animate={isStatsExpanded ? "visible" : "hidden"}
          ref={statsRef}
        >
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium" style={{ color: colors.text }}>Dashboard Overview</h2>
              <motion.button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="p-2 rounded-full"
                whileHover={{ backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                style={{ color: colors.text }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isStatsExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} 
                  />
                </svg>
              </motion.button>
            </div>
            
            <AnimatePresence>
              {isStatsExpanded && (
                <motion.div
                  key="stats-expanded"
                  variants={fadeInVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main stats */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                      {/* Total Companies */}
                      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                        <div className="bg-opacity-10 rounded-xl p-4" style={{ backgroundColor: `${colors.primary}30` }}>
                          <div className="flex items-center">
                            <motion.div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 relative overflow-hidden"
                              style={{ backgroundColor: `${colors.primary}20` }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{ backgroundColor: `${colors.primary}10` }}
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 0.9, 0.7]
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 3,
                                  ease: "easeInOut" 
                                }}
                              />
                              <svg className="w-6 h-6 relative z-10" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </motion.div>
                            <div>
                              <p className="text-xs" style={{ color: `${colors.text}99` }}>Total Companies</p>
                              <motion.p 
                                className="text-xl font-bold" 
                                style={{ color: colors.text }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {loading ? (
                                  <motion.span
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    ...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key={stats.total}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                  >
                                    {stats.total}
                                  </motion.span>
                                )}
                              </motion.p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Open Positions */}
                      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                        <div className="bg-opacity-10 rounded-xl p-4" style={{ backgroundColor: `${colors.secondary}30` }}>
                          <div className="flex items-center">
                            <motion.div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 relative overflow-hidden"
                              style={{ backgroundColor: `${colors.secondary}20` }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{ backgroundColor: `${colors.secondary}10` }}
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 0.9, 0.7]
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 3,
                                  ease: "easeInOut",
                                  delay: 0.5
                                }}
                              />
                              <svg className="w-6 h-6 relative z-10" fill="none" stroke={colors.secondary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </motion.div>
                            <div>
                              <p className="text-xs" style={{ color: `${colors.text}99` }}>Open Positions</p>
                              <motion.p 
                                className="text-xl font-bold" 
                                style={{ color: colors.text }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                {loading ? (
                                  <motion.span
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    ...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key={stats.openPositions}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                  >
                                    {stats.openPositions}
                                  </motion.span>
                                )}
                              </motion.p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Active Clients */}
                      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                        <div className="bg-opacity-10 rounded-xl p-4" style={{ backgroundColor: `${colors.primary}30` }}>
                          <div className="flex items-center">
                            <motion.div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 relative overflow-hidden"
                              style={{ backgroundColor: `${colors.primary}20` }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{ backgroundColor: `${colors.primary}10` }}
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 0.9, 0.7]
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 3,
                                  ease: "easeInOut",
                                  delay: 1.0
                                }}
                              />
                              <svg className="w-6 h-6 relative z-10" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </motion.div>
                            <div>
                              <p className="text-xs" style={{ color: `${colors.text}99` }}>Active Clients</p>
                              <motion.p 
                                className="text-xl font-bold" 
                                style={{ color: colors.text }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                              >
                                {loading ? (
                                  <motion.span
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    ...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key={stats.activeClients}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                  >
                                    {stats.activeClients}
                                  </motion.span>
                                )}
                              </motion.p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Recent Activity */}
                      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                        <div className="bg-opacity-10 rounded-xl p-4" style={{ backgroundColor: `${colors.secondary}30` }}>
                          <div className="flex items-center">
                            <motion.div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 relative overflow-hidden"
                              style={{ backgroundColor: `${colors.secondary}20` }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{ backgroundColor: `${colors.secondary}10` }}
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 0.9, 0.7]
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 3,
                                  ease: "easeInOut",
                                  delay: 1.5
                                }}
                              />
                              <svg className="w-6 h-6 relative z-10" fill="none" stroke={colors.secondary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </motion.div>
                            <div>
                              <p className="text-xs" style={{ color: `${colors.text}99` }}>Recently Added</p>
                              <motion.p 
                                className="text-xl font-bold" 
                                style={{ color: colors.text }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                {loading ? (
                                  <motion.span
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    ...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key={stats.recentlyAdded}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                  >
                                    {stats.recentlyAdded}
                                  </motion.span>
                                )}
                              </motion.p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Industry Distribution Chart */}
                    <motion.div 
                      variants={chartVariants}
                      className="col-span-1"
                    >
                      <div className="h-full">
                        <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>Industry Distribution</h3>
                        {loading ? (
                          <div className="flex justify-center items-center h-32">
                            <motion.div
                              className="w-8 h-8 border-2 border-t-transparent rounded-full"
                              style={{ borderColor: `${colors.primary}40`, borderTopColor: 'transparent' }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {stats.industries && stats.industries.length > 0 ? (
                              stats.industries.map(([industry, count], index) => {
                                const percentage = (count / stats.total) * 100;
                                const industryColors = getIndustryColor(industry);
                                
                                return (
                                  <div key={industry} className="text-xs">
                                    <div className="flex justify-between mb-1">
                                      <span 
                                        className="truncate max-w-[70%] font-medium" 
                                        style={{ color: colors.text }}
                                      >
                                        {industry}
                                      </span>
                                      <div className="flex items-center">
                                        <span style={{ color: `${colors.text}99` }}>{count}</span>
                                        <span 
                                          className="ml-2 text-[10px] px-1.5 rounded"
                                          style={{ 
                                            backgroundColor: industryColors.bg,
                                            color: industryColors.text
                                          }}
                                        >
                                          {percentage.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1 overflow-hidden">
                                      <motion.div 
                                        className="h-full rounded-full" 
                                        style={{ backgroundColor: industryColors.text }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 + (index * 0.1) }}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs" style={{ color: `${colors.text}80` }}>No data available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                    
                    {/* Recent Activity Feed */}
                    <motion.div variants={itemVariants}>
                      <div className="h-full">
                        <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                          <div 
                            className="text-xs p-4 rounded-lg text-center"
                            style={{ 
                              backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                              color: `${colors.text}80` 
                            }}
                          >
                            No recent activity
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-2">
                            {recentActivity.slice(0, 6).map((activity, index) => {
                              const company = companies?.find(c => c.id === activity.id);
                              if (!company) return null;
                              
                              return (
                                <motion.div 
                                  key={`${activity.id}-${index}`}
                                  className="flex items-start p-2 rounded-lg"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'
                                  }}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                    x: 2
                                  }}
                                >
                                  <div 
                                    className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs mr-3 flex-shrink-0"
                                    style={{ backgroundColor: getIndustryColor(company.industry).text }}
                                  >
                                    {company.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate" style={{ color: colors.text }}>{company.name}</p>
                                    <p className="text-[10px]" style={{ color: `${colors.text}99` }}>
                                      {activity.action}
                                    </p>
                                    <p className="text-[10px]" style={{ color: `${colors.text}80` }}>
                                      {formatRelativeDate(activity.timestamp)}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Search and Filter section */}
        <motion.div 
          variants={itemVariants} 
          className="mb-6 sticky top-0 z-30"
          ref={filterBarRef}
          style={{ 
            opacity: filterBarOpacity,
            scale: filterBarScale,
            position: isFilterBarSticky ? 'sticky' : 'relative'
          }}
        >
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <Input
                    placeholder="Search companies, industry, or contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    rightIcon={searchTerm ? (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="focus:outline-none"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : undefined}
                  />
                </div>
                
                <div className="w-full sm:w-auto">
                  <Select
                    options={[
                      { value: 'all', label: 'All Industries' },
                      ...uniqueIndustries.map(industry => ({ value: industry, label: industry })),
                    ]}
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                  />
                </div>
                
                <motion.button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg"
                  whileHover={{ 
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    backgroundColor: showAdvancedFilters 
                      ? `${colors.primary}15` 
                      : 'transparent',
                    color: showAdvancedFilters 
                      ? colors.primary 
                      : colors.text,
                    border: `1px solid ${showAdvancedFilters ? colors.primary : colors.border}`
                  }}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
                    />
                  </svg>
                  {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
                </motion.button>
              </div>
              
              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    key="advanced-filters"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 pb-3 border-t border-b" style={{ borderColor: colors.border }}>
                      <div className="col-span-1">
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <Input
                              label="Min Jobs"
                              type="number"
                              min="0"
                              value={advancedFilters.minJobs}
                              onChange={(e) => setAdvancedFilters({...advancedFilters, minJobs: e.target.value})}
                              fullWidth
                            />
                          </div>
                          <div className="w-1/2">
                            <Input
                              label="Max Jobs"
                              type="number"
                              min="0"
                              value={advancedFilters.maxJobs}
                              onChange={(e) => setAdvancedFilters({...advancedFilters, maxJobs: e.target.value})}
                              fullWidth
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Select
                          label="Date Added"
                          options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'last7days', label: 'Last 7 Days' },
                            { value: 'last30days', label: 'Last 30 Days' },
                            { value: 'last90days', label: 'Last 90 Days' }
                          ]}
                          value={advancedFilters.dateRange}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, dateRange: e.target.value})}
                          fullWidth
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          label="Contact Search"
                          placeholder="Search in contacts..."
                          value={advancedFilters.contactFilter}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, contactFilter: e.target.value})}
                          fullWidth
                        />
                      </div>
                      <div className="col-span-1">
                        <div className="h-full flex items-end">
                          <Select
                            label="Group By"
                            options={[
                              { value: 'none', label: 'No Grouping' },
                              { value: 'industry', label: 'Industry' },
                              { value: 'status', label: 'Status' }
                            ]}
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t" style={{ borderColor: `${colors.border}` }}>
                <div className="flex items-center gap-1">
                  <span className="text-sm" style={{ color: `${colors.text}99` }}>Sort by:</span>
                  
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => handleSortClick('name')}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        backgroundColor: sortBy === 'name' 
                          ? `${colors.primary}20` 
                          : theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        color: sortBy === 'name' ? colors.primary : colors.text
                      }}
                    >
                      Name
                      {sortBy === 'name' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={sortOrder === 'asc' 
                              ? "M8 7l4-4m0 0l4 4m-4-4v18" 
                              : "M16 17l-4 4m0 0l-4-4m4 4V3"} 
                          />
                        </svg>
                      )}
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleSortClick('openPositions')}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        backgroundColor: sortBy === 'openPositions' 
                          ? `${colors.primary}20` 
                          : theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        color: sortBy === 'openPositions' ? colors.primary : colors.text
                      }}
                    >
                      Open Jobs
                      {sortBy === 'openPositions' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={sortOrder === 'asc' 
                              ? "M8 7l4-4m0 0l4 4m-4-4v18" 
                              : "M16 17l-4 4m0 0l-4-4m4 4V3"} 
                          />
                        </svg>
                      )}
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleSortClick('dateAdded')}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        backgroundColor: sortBy === 'dateAdded' 
                          ? `${colors.primary}20` 
                          : theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        color: sortBy === 'dateAdded' ? colors.primary : colors.text
                      }}
                    >
                      Date Added
                      {sortBy === 'dateAdded' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={sortOrder === 'asc' 
                              ? "M8 7l4-4m0 0l4 4m-4-4v18" 
                              : "M16 17l-4 4m0 0l-4-4m4 4V3"} 
                          />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(searchTerm || industryFilter !== 'all' || sortBy !== 'dateAdded' || sortOrder !== 'desc' || showAdvancedFilters) && (
                    <motion.button
                      onClick={clearFilters}
                      className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        color: colors.text
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </motion.button>
                  )}
                  
                  <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                    <motion.button
                      onClick={() => setView('grid')}
                      className={`p-1.5 border-r`}
                      whileHover={{ backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        backgroundColor: view === 'grid' 
                          ? `${colors.primary}20` 
                          : 'transparent',
                        color: view === 'grid' ? colors.primary : colors.text,
                        borderColor: colors.border
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => setView('list')}
                      className="p-1.5 border-r"
                      whileHover={{ backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        backgroundColor: view === 'list' 
                          ? `${colors.primary}20` 
                          : 'transparent',
                        color: view === 'list' ? colors.primary : colors.text,
                        borderColor: colors.border
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => setView('kanban')}
                      className="p-1.5"
                      whileHover={{ backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        backgroundColor: view === 'kanban' 
                          ? `${colors.primary}20` 
                          : 'transparent',
                        color: view === 'kanban' ? colors.primary : colors.text
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Results info */}
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-4">
          <p className="text-sm" style={{ color: `${colors.text}99` }}>
            {loading ? 'Loading companies...' : `Showing ${filteredCompanies.length} ${filteredCompanies.length === 1 ? 'company' : 'companies'}`}
            {searchTerm && ` matching "${searchTerm}"`}
            {industryFilter !== 'all' && ` in ${industryFilter}`}
          </p>
          {selectedCompanies.length > 0 && (
            <p className="text-sm font-medium" style={{ color: colors.primary }}>
              {selectedCompanies.length} selected
            </p>
          )}
        </motion.div>

        {/* Companies Grid/List/Kanban View */}
        <AnimatePresence mode="wait">
          {/* Loading state */}
          {loading ? (
            <motion.div 
              className="flex justify-center items-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
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
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      border: `3px dashed ${colors.secondary}20`,
                      borderBottomColor: colors.secondary 
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
                <p style={{ color: `${colors.text}99` }}>Loading companies...</p>
                <motion.p 
                  className="mt-2 text-xs"
                  style={{ color: `${colors.text}60` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Preparing your data
                </motion.p>
              </div>
            </motion.div>
          ) : filteredCompanies.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="empty"
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="relative w-24 h-24 mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.2, 
                  type: "spring",
                  stiffness: 100 
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-opacity-10"
                  style={{ backgroundColor: colors.primary }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut" 
                  }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full bg-opacity-20"
                  style={{ backgroundColor: colors.primary }}
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.9, 0.6]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className="w-12 h-12" 
                    fill="none" 
                    stroke={colors.primary} 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h3 className="text-xl font-medium mb-2" style={{ color: colors.text }}>No companies found</h3>
                <p className="text-center max-w-md mb-6" style={{ color: `${colors.text}99` }}>
                  {searchTerm || industryFilter !== 'all' || showAdvancedFilters
                    ? "Try adjusting your search filters to find what you're looking for."
                    : "You haven't added any companies yet. Add a company to get started."}
                </p>
                
                <div className="flex justify-center gap-3">
                  {(searchTerm || industryFilter !== 'all' || showAdvancedFilters) && (
                    <Button 
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                  
                  <Button 
                    variant="primary"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    }
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add Your First Company
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <>
              {/* Grid View */}
              {view === 'grid' && (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key="grid-view"
                  variants={containerVariants}
                >
                  {Object.entries(groupedCompanies).map(([groupName, companies]) => (
                    <motion.div key={groupName} className="space-y-4">
                      {/* If grouped, show group header */}
                      {groupBy !== 'none' && (
                        <motion.div 
                          className="flex items-center gap-2 my-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-lg font-medium" style={{ color: colors.text }}>{groupName}</h2>
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${colors.primary}20`,
                              color: colors.primary
                            }}
                          >
                            {companies.length}
                          </span>
                          <div className="flex-1 h-px" style={{ backgroundColor: `${colors.border}` }}></div>
                        </motion.div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {companies.map((company) => (
                          <motion.div
                            key={company.id}
                            variants={itemVariants}
                            layoutId={`company-${company.id}`}
                            whileHover={{ y: -5, boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                            initial={{opacity: 0.5, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.3}}
                            onHoverStart={() => setHoveredCompany(company.id)}
                            onHoverEnd={() => setHoveredCompany(null)}
                          >
                            <Card
                              className={`h-full flex flex-col relative ${
                                isSelectionMode ? '' : 'cursor-pointer'
                              } ${
                                selectedCompanies.includes(company.id) ? 'ring-2' : ''
                              } overflow-hidden`}
                              customBorderColor={favoriteCompanies.includes(company.id)
                                ? `${colors.primary}80`
                                : colors.border}
                              customRingColor={selectedCompanies.includes(company.id)
                                ? colors.primary
                                : 'transparent'}
                            >
                              {/* Selection checkbox for bulk actions */}
                              {isSelectionMode && (
                                <div 
                                  className="absolute top-2 left-2 z-10 rounded-md overflow-hidden"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompanySelection(company.id);
                                  }}
                                >
                                  <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="w-5 h-5 flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: selectedCompanies.includes(company.id) 
                                        ? colors.primary 
                                        : theme === 'light' ? 'white' : colors.card,
                                      border: `1px solid ${selectedCompanies.includes(company.id) 
                                        ? colors.primary 
                                        : colors.border}`
                                    }}
                                  >
                                    {selectedCompanies.includes(company.id) && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </motion.div>
                                </div>
                              )}

                              {/* Favorite Icon */}
                              <div 
                                className="absolute top-2 right-2 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(company.id);
                                }}
                              >
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer`}
                                  style={{ color: favoriteCompanies.includes(company.id) ? '#F59E0B' : `${colors.text}60` }}
                                >
                                  <svg 
                                    className="w-5 h-5" 
                                    fill={favoriteCompanies.includes(company.id) ? 'currentColor' : 'none'} 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={favoriteCompanies.includes(company.id) ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                </motion.button>
                              </div>
                              
                              <div
                                onClick={() => !isSelectionMode && handleCompanyClick(company.id)}
                                className="flex-grow flex flex-col p-5"
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex w-full justify-between items-start mb-4">
                                    <div className="flex items-center">
                                      <div
                                        className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-base font-bold mr-3 shadow-sm"
                                        style={{
                                          background: `linear-gradient(135deg, ${getIndustryColor(company.industry).text}, ${getIndustryColor(company.industry).border})`
                                        }}
                                      >
                                        {company.name.charAt(0)}
                                      </div>
                                      <div>
                                        <h3
                                          className="font-semibold text-lg truncate max-w-[170px] mb-1.5"
                                          style={{ color: colors.text }}
                                        >
                                          {company.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="inline-block px-2.5 py-1 rounded-md text-xs font-medium"
                                            style={{
                                              backgroundColor: getIndustryColor(company.industry).bg,
                                              color: getIndustryColor(company.industry).text,
                                              border: `1px solid ${getIndustryColor(company.industry).border}`
                                            }}
                                          >
                                            {company.industry}
                                          </div>

                                          <div className="h-4 w-px" style={{ backgroundColor: colors.border }}></div>

                                          <div className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke={company.openPositions > 0 ? "#10B981" : colors.primary} viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-medium" style={{ color: company.openPositions > 0 ? "#10B981" : colors.primary }}>
                                              {company.openPositions} {company.openPositions === 1 ? 'Job' : 'Jobs'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2.5 mb-4 text-sm mt-2">
                                  <div className="flex items-center border-l-2 pl-2"
                                       style={{ color: `${colors.text}99`, borderColor: `${colors.secondary}40` }}>
                                    <div className="bg-opacity-10 p-1.5 rounded-md mr-2 flex-shrink-0"
                                         style={{ backgroundColor: `${colors.secondary}30` }}>
                                      <svg className="w-4 h-4" fill="none" stroke={colors.secondary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <span className="truncate font-medium" style={{ color: colors.text }}>{company.contactPerson}</span>
                                  </div>

                                  {company.contactEmail && (
                                    <div className="flex items-center border-l-2 pl-2"
                                         style={{ color: `${colors.text}99`, borderColor: `${colors.primary}40` }}>
                                      <div className="bg-opacity-10 p-1.5 rounded-md mr-2 flex-shrink-0"
                                           style={{ backgroundColor: `${colors.primary}30` }}>
                                        <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <span className="truncate">{company.contactEmail}</span>
                                    </div>
                                  )}

                                  {company.website && (
                                    <div className="flex items-center border-l-2 pl-2"
                                         style={{ color: `${colors.text}99`, borderColor: `${colors.secondary}40` }}>
                                      <div className="bg-opacity-10 p-1.5 rounded-md mr-2 flex-shrink-0"
                                           style={{ backgroundColor: `${colors.secondary}30` }}>
                                        <svg className="w-4 h-4" fill="none" stroke={colors.secondary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                      </div>
                                      <a
                                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate hover:underline"
                                        style={{ color: colors.primary }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {company.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                                      </a>
                                    </div>
                                  )}

                                  {company.contactPhone && (
                                    <div className="flex items-center border-l-2 pl-2"
                                         style={{ color: `${colors.text}99`, borderColor: `${colors.primary}40` }}>
                                      <div className="bg-opacity-10 p-1.5 rounded-md mr-2 flex-shrink-0"
                                           style={{ backgroundColor: `${colors.primary}30` }}>
                                        <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                      </div>
                                      <span className="truncate">{company.contactPhone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div
                                className="flex justify-between items-center pt-4 mt-auto border-t"
                                style={{ borderColor: `${colors.border}50` }}
                              >
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: `${colors.text}70` }}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>Added {new Date(company.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-2">
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCompanyClick(company.id);
                                    }}
                                    className="p-2 rounded-full flex items-center justify-center bg-opacity-10 text-xs gap-1 font-medium"
                                    style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                                    whileHover={{
                                      scale: 1.05,
                                      backgroundColor: `${colors.primary}25`
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>View</span>
                                  </motion.button>

                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCompany(company.id);
                                    }}
                                    className="p-2 rounded-full flex items-center justify-center bg-opacity-10 text-xs"
                                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                                    whileHover={{
                                      scale: 1.05,
                                      backgroundColor: 'rgba(239,68,68,0.2)'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </div>
                              
                              {/* Quick action menu on hover */}
                              <AnimatePresence>
                                {hoveredCompany === company.id && !isSelectionMode && (
                                  <motion.div
                                    key={`hover-menu-${company.id}`}
                                    className="absolute right-2 top-10 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border"
                                    style={{ borderColor: colors.border }}
                                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <div className="divide-y" style={{ borderColor: colors.border }}>
                                      <motion.button
                                        className="px-3 py-2 text-xs flex items-center w-full text-left"
                                        whileHover={{ 
                                          backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                        }}
                                        style={{ color: colors.primary }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Add job for this company
                                          console.log('Add job for company:', company.id);
                                        }}
                                      >
                                        <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Job
                                      </motion.button>
                                      <motion.button
                                        className="px-3 py-2 text-xs flex items-center w-full text-left"
                                        whileHover={{ 
                                          backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                        }}
                                        style={{ color: colors.text }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(company.id);
                                        }}
                                      >
                                        <svg className="w-3.5 h-3.5 mr-2" fill={favoriteCompanies.includes(company.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={favoriteCompanies.includes(company.id) ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        {favoriteCompanies.includes(company.id) ? 'Remove Favorite' : 'Add to Favorites'}
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* List View */}
              {view === 'list' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key="list-view"
                  variants={containerVariants}
                  className="space-y-6"
                >
                  {Object.entries(groupedCompanies).map(([groupName, companies]) => (
                    <motion.div key={groupName} className="space-y-4">
                      {/* If grouped, show group header */}
                      {groupBy !== 'none' && (
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-lg font-medium" style={{ color: colors.text }}>{groupName}</h2>
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${colors.primary}20`,
                              color: colors.primary
                            }}
                          >
                            {companies.length}
                          </span>
                          <div className="flex-1 h-px" style={{ backgroundColor: `${colors.border}` }}></div>
                        </motion.div>
                      )}
                      
                      <Card noPadding className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 hover:shadow-xl transition-shadow duration-300">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                          <table className="min-w-full divide-y" style={{ borderColor: `${colors.border}40` }}>
                            <thead className="sticky top-0 z-10" style={{ 
                              backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937', 
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              <tr>
                                {isSelectionMode && (
                                  <th className="pl-4 pr-0 py-3.5 w-10 text-left">
                                    <div
                                      className="w-5 h-5 rounded-md cursor-pointer transition-all duration-200 relative flex items-center justify-center"
                                      style={{
                                        backgroundColor: selectedCompanies.length === companies.length && companies.length > 0
                                          ? colors.primary
                                          : theme === 'light' ? 'white' : colors.card,
                                        border: `1px solid ${selectedCompanies.length === companies.length && companies.length > 0
                                          ? colors.primary
                                          : colors.border}`,
                                        boxShadow: selectedCompanies.length === companies.length && companies.length > 0
                                          ? `0 0 0 2px ${colors.primary}30`
                                          : 'none'
                                      }}
                                      onClick={() => {
                                        if (selectedCompanies.length === companies.length) {
                                          // Deselect all in this group
                                          setSelectedCompanies(prev =>
                                            prev.filter(id => !companies.some(c => c.id === id))
                                          );
                                        } else {
                                          // Select all in this group
                                          const companyIds = companies.map(c => c.id);
                                          setSelectedCompanies(prev => [
                                            ...prev.filter(id => !companyIds.includes(id)),
                                            ...companyIds
                                          ]);
                                        }
                                      }}
                                    >
                                      {selectedCompanies.length === companies.length && companies.length > 0 && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                      
                                      <motion.span 
                                        className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-800 rounded-full text-[9px] px-1 font-semibold"
                                        style={{ 
                                          color: colors.primary,
                                          border: `1px solid ${colors.primary}50`,
                                          opacity: selectedCompanies.length > 0 ? 1 : 0,
                                          scale: selectedCompanies.length > 0 ? 1 : 0.5
                                        }}
                                        animate={{ 
                                          opacity: selectedCompanies.length > 0 ? 1 : 0,
                                          scale: selectedCompanies.length > 0 ? 1 : 0.5
                                        }}
                                      >
                                        {selectedCompanies.length}
                                      </motion.span>
                                    </div>
                                  </th>
                                )}
                                <th
                                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.primary,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <motion.div 
                                      whileHover={{ rotate: 360 }} 
                                      transition={{ duration: 0.5 }}
                                      className="bg-opacity-10 p-1 rounded-full"
                                      style={{ backgroundColor: `${colors.primary}20` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                    </motion.div>
                                    <span>Company</span>
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.secondary,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <motion.div 
                                      whileHover={{ rotate: 360 }} 
                                      transition={{ duration: 0.5 }}
                                      className="bg-opacity-10 p-1 rounded-full"
                                      style={{ backgroundColor: `${colors.secondary}20` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                      </svg>
                                    </motion.div>
                                    <span>Industry</span>
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.primary,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <motion.div 
                                      whileHover={{ rotate: 360 }} 
                                      transition={{ duration: 0.5 }}
                                      className="bg-opacity-10 p-1 rounded-full"
                                      style={{ backgroundColor: `${colors.primary}20` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </motion.div>
                                    <span>Contact</span>
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.secondary,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <motion.div 
                                      whileHover={{ rotate: 360 }} 
                                      transition={{ duration: 0.5 }}
                                      className="bg-opacity-10 p-1 rounded-full"
                                      style={{ backgroundColor: `${colors.secondary}20` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </motion.div>
                                    <span>Jobs</span>
                                  </div>
                                </th>
                                <th
                                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.primary,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <motion.div 
                                      whileHover={{ rotate: 360 }} 
                                      transition={{ duration: 0.5 }}
                                      className="bg-opacity-10 p-1 rounded-full"
                                      style={{ backgroundColor: `${colors.primary}20` }}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </motion.div>
                                    <span className="hidden sm:inline">Added</span>
                                    <span className="sm:hidden">Date</span>
                                  </div>
                                </th>
                                <th
                                  className="pl-4 pr-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap"
                                  style={{
                                    color: colors.secondary,
                                  }}
                                >
                                  <span className="hidden sm:inline">Actions</span>
                                  <span className="sm:hidden">
                                    <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                  </span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: `${colors.border}40` }}>
                              {companies.map((company, index) => (
                                <motion.tr
                                  key={company.id}
                                  layoutId={`company-row-${company.id}`}
                                  variants={itemVariants}
                                  className={`transition-all duration-200 group ${isSelectionMode ? '' : 'cursor-pointer'}`}
                                  style={{
                                    backgroundColor: selectedCompanies.includes(company.id) 
                                      ? `${colors.primary}10`
                                      : index % 2 === 0
                                        ? theme === 'light' ? 'rgba(249, 250, 251, 0.5)' : 'rgba(31, 41, 55, 0.5)'
                                        : 'transparent',
                                    borderLeft: favoriteCompanies.includes(company.id)
                                      ? `4px solid ${colors.primary}`
                                      : '4px solid transparent',
                                  }}
                                  onClick={() => isSelectionMode
                                    ? handleCompanySelection(company.id)
                                    : handleCompanyClick(company.id)
                                  }
                                  whileHover={{
                                    backgroundColor: theme === 'light'
                                      ? 'rgba(243, 244, 246, 0.7)'
                                      : 'rgba(55, 65, 81, 0.7)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    scale: 1.0025,
                                    y: -1
                                  }}
                                >
                                  {isSelectionMode && (
                                    <td className="pl-4 pr-0 py-4 align-middle w-10">
                                      <div
                                        className="w-5 h-5 rounded-md cursor-pointer transition-all duration-150 flex items-center justify-center"
                                        style={{
                                          backgroundColor: selectedCompanies.includes(company.id)
                                            ? colors.primary
                                            : theme === 'light' ? 'white' : colors.card,
                                          border: `1px solid ${selectedCompanies.includes(company.id)
                                            ? colors.primary
                                            : colors.border}`,
                                          boxShadow: selectedCompanies.includes(company.id)
                                            ? `0 0 0 2px ${colors.primary}30`
                                            : 'none'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCompanySelection(company.id);
                                        }}
                                      >
                                        {selectedCompanies.includes(company.id) && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                          >
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </motion.div>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center max-w-[250px]">
                                      <motion.div
                                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold shadow-sm overflow-hidden"
                                        style={{
                                          background: `linear-gradient(135deg, ${getIndustryColor(company.industry).text}, ${getIndustryColor(company.industry).border})`
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                      >
                                        <motion.span
                                          initial={{ opacity: 0, scale: 0.5 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: 0.1, type: "spring" }}
                                        >
                                          {company.name.charAt(0)}
                                        </motion.span>
                                      </motion.div>
                                      <div className="ml-3 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                          <motion.div
                                            className="font-medium text-base truncate max-w-[180px]"
                                            style={{ color: colors.text }}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15 }}
                                          >
                                            {company.name}
                                          </motion.div>
                                          {favoriteCompanies.includes(company.id) && (
                                            <motion.div
                                              initial={{scale: 0}}
                                              animate={{scale: 1}}
                                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                            >
                                              <svg
                                                className="w-4 h-4 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                style={{ color: '#F59E0B' }}
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                              </svg>
                                            </motion.div>
                                          )}
                                        </div>
                                        
                                        {company.website && (
                                          <div className="text-xs truncate max-w-[200px] flex items-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                            <motion.div
                                              className="rounded-full p-0.5 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"
                                              style={{ backgroundColor: colors.primary }}
                                              whileHover={{ rotate: 180 }}
                                              transition={{ duration: 0.5 }}
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                              </svg>
                                            </motion.div>
                                            <a
                                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:underline group-hover:text-opacity-100 transition-all duration-150 truncate"
                                              style={{ color: colors.primary, textDecoration: 'none' }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {company.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <motion.div
                                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium shadow-sm gap-1.5"
                                      style={{
                                        backgroundColor: getIndustryColor(company.industry).bg,
                                        color: getIndustryColor(company.industry).text,
                                        border: `1px solid ${getIndustryColor(company.industry).border}`
                                      }}
                                      whileHover={{
                                        y: -2,
                                        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                                        backgroundColor: `${getIndustryColor(company.industry).bg}dd`
                                      }}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    >
                                      <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                      </motion.div>
                                      <span className="truncate max-w-[100px]" title={company.industry}>{company.industry}</span>
                                    </motion.div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex flex-col max-w-[200px]">
                                      <div className="flex items-center gap-2 group whitespace-nowrap">
                                        <motion.div
                                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                          style={{ backgroundColor: `${colors.secondary}20` }}
                                          whileHover={{ scale: 1.1, backgroundColor: `${colors.secondary}30` }}
                                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={colors.secondary}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                        </motion.div>
                                        <span className="font-medium truncate group-hover:text-opacity-90 transition-colors duration-150" 
                                          style={{ color: colors.text }}
                                          title={company.contactPerson}
                                        >
                                          {company.contactPerson}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 group mt-1.5">
                                        <motion.div
                                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                          style={{ backgroundColor: `${colors.primary}20` }}
                                          whileHover={{ scale: 1.1, backgroundColor: `${colors.primary}30` }}
                                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                        </motion.div>
                                        <a
                                          href={`mailto:${company.contactEmail}`}
                                          className="text-xs truncate max-w-[140px] hover:underline group-hover:text-opacity-100 transition-colors duration-150"
                                          style={{ color: colors.primary }}
                                          onClick={(e) => e.stopPropagation()}
                                          title={company.contactEmail}
                                        >
                                          {company.contactEmail || 'N/A'}
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <motion.div
                                        className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium"
                                        style={{
                                          backgroundColor: company.openPositions > 0
                                            ? 'rgba(16, 185, 129, 0.15)'
                                            : `${colors.primary}15`,
                                          color: company.openPositions > 0
                                            ? '#10B981'
                                            : colors.primary,
                                          border: `1px solid ${company.openPositions > 0
                                            ? 'rgba(16, 185, 129, 0.3)'
                                            : `${colors.primary}30`}`
                                        }}
                                        whileHover={{ scale: 1.15, y: -2 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 10 }}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                      >
                                        {company.openPositions}
                                      </motion.div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium" style={{ color: company.openPositions > 0 ? '#10B981' : colors.primary }}>
                                          {company.openPositions === 1 ? 'position' : 'positions'}
                                        </span>
                                        {company.openPositions > 0 && (
                                          <span className="text-[10px]" style={{ color: `${colors.text}50` }}>
                                            active client
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 group">
                                      <motion.div
                                        className="p-1.5 rounded-full bg-opacity-10 flex-shrink-0"
                                        style={{ backgroundColor: `${colors.primary}20` }}
                                        whileHover={{ rotate: 360, backgroundColor: `${colors.primary}30` }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </motion.div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium truncate group-hover:text-opacity-90 transition-colors duration-150 max-w-[80px] sm:max-w-[100px]" style={{ color: colors.text }}>
                                          {new Date(company.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                        <span className="text-[10px] hidden sm:block" style={{ color: `${colors.text}60` }}>
                                          {formatRelativeDate(company.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="pr-6 pl-4 py-4 whitespace-nowrap text-right">
                                    <div className="group-hover:opacity-100 opacity-90 transition-opacity duration-200 flex items-center justify-end gap-2">
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(company.id);
                                        }}
                                        className={`p-2 rounded-full ${favoriteCompanies.includes(company.id) ? 'bg-amber-50 dark:bg-amber-900 dark:bg-opacity-20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        whileHover={{ scale: 1.1, rotate: favoriteCompanies.includes(company.id) ? 0 : 20 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                          color: favoriteCompanies.includes(company.id) ? '#F59E0B' : `${colors.text}60`,
                                          boxShadow: favoriteCompanies.includes(company.id) ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none'
                                        }}
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 + 0.2 }}
                                      >
                                        <motion.div
                                          animate={favoriteCompanies.includes(company.id) ? { scale: [1, 1.2, 1] } : {}}
                                          transition={{ repeat: 0, duration: 0.3 }}
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill={favoriteCompanies.includes(company.id) ? 'currentColor' : 'none'}
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={favoriteCompanies.includes(company.id) ? 0 : 1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                          </svg>
                                        </motion.div>
                                        <span className="sr-only">
                                          {favoriteCompanies.includes(company.id) ? 'Remove from favorites' : 'Add to favorites'}
                                        </span>
                                      </motion.button>
                                      
                                      <div className="relative sm:hidden">
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setHoveredCompany(hoveredCompany === company.id ? null : company.id);
                                          }}
                                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                          style={{ color: hoveredCompany === company.id ? colors.primary : colors.text }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                          </svg>
                                        </motion.button>
                                        
                                        <AnimatePresence>
                                          {hoveredCompany === company.id && (
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.95, y: 5, x: -40 }}
                                              animate={{ opacity: 1, scale: 1, y: 0, x: -110 }}
                                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                              transition={{ duration: 0.2 }}
                                              className="absolute top-0 right-0 mt-10 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border"
                                              style={{ borderColor: colors.border }}
                                            >
                                              <div className="py-1 w-[140px]">
                                                <motion.button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCompanyClick(company.id);
                                                  }}
                                                  className="flex items-center w-full px-4 py-2 text-left text-sm"
                                                  whileHover={{
                                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                                  }}
                                                  style={{ color: colors.primary }}
                                                >
                                                  <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                  </svg>
                                                  View Details
                                                </motion.button>
                                                <motion.button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCompany(company.id);
                                                    setHoveredCompany(null);
                                                  }}
                                                  className="flex items-center w-full px-4 py-2 text-left text-sm"
                                                  whileHover={{
                                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                                                  }}
                                                  style={{ color: '#EF4444' }}
                                                >
                                                  <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                  Delete
                                                </motion.button>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                      
                                      <motion.div className="hidden sm:flex gap-2">
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompanyClick(company.id);
                                          }}
                                          className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 relative overflow-hidden"
                                          whileHover={{ scale: 1.05, y: -1 }}
                                          whileTap={{ scale: 0.95 }}
                                          style={{
                                            backgroundColor: `${colors.primary}15`,
                                            color: colors.primary,
                                            border: `1px solid ${colors.primary}30`
                                          }}
                                          initial={{ opacity: 0, x: 5 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.05 + 0.3 }}
                                        >
                                          <motion.span
                                            className="absolute inset-0 opacity-0"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 0.1 }}
                                            style={{ backgroundColor: colors.primary }}
                                          />
                                          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          </motion.div>
                                          <span>View</span>
                                        </motion.button>
                                        
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCompany(company.id);
                                          }}
                                          className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 relative overflow-hidden"
                                          whileHover={{ scale: 1.05, y: -1 }}
                                          whileTap={{ scale: 0.95 }}
                                          style={{
                                            backgroundColor: 'rgba(239,68,68,0.15)',
                                            color: '#EF4444',
                                            border: '1px solid rgba(239,68,68,0.3)'
                                          }}
                                          initial={{ opacity: 0, x: 5 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.05 + 0.4 }}
                                        >
                                          <motion.span
                                            className="absolute inset-0 opacity-0"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 0.1 }}
                                            style={{ backgroundColor: '#EF4444' }}
                                          />
                                          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </motion.div>
                                          <span>Delete</span>
                                        </motion.button>
                                      </motion.div>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                              
                              {companies.length === 0 && (
                                <tr>
                                  <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-12 text-center">
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="flex flex-col items-center"
                                    >
                                      <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <p className="mb-2" style={{ color: colors.text }}>No companies found in this group</p>
                                      <p className="text-sm" style={{ color: `${colors.text}70` }}>
                                        Try adjusting your filters or add a new company
                                      </p>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            
                            <tfoot className="bg-gray-50 dark:bg-gray-800 border-t" style={{ borderColor: colors.border }}>
                              <tr>
                                <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-3">
                                  <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: `${colors.text}80` }}>
                                      Showing <span className="font-medium" style={{ color: colors.text }}>{companies.length}</span> companies
                                    </span>
                                    {selectedCompanies.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span style={{ color: `${colors.text}80` }}>
                                          Selected: <span className="font-medium" style={{ color: colors.primary }}>{selectedCompanies.length}</span>
                                        </span>
                                        <Button 
                                          variant="danger" 
                                          size="xs"
                                          onClick={handleBulkDelete}
                                          leftIcon={
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          }
                                        >
                                          Delete Selected
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Kanban View - A status-based view of companies */}
              {view === 'kanban' && (
                <motion.div 
                  className="overflow-x-auto pb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key="kanban-view"
                >
                  <div className="flex gap-4 min-w-max pb-4">
                    {['Inactive', 'Active'].map(status => {
                      const statusCompanies = filteredCompanies.filter(c => 
                        status === 'Active' ? c.openPositions > 0 : c.openPositions === 0
                      );
                      
                      return (
                        <motion.div 
                          key={status}
                          className="min-w-[320px] w-[320px]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                        >
                          <Card>
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ 
                                    backgroundColor: status === 'Active' ? '#10B981' : '#6B7280'
                                  }}
                                ></div>
                                <h3 className="font-medium" style={{ color: colors.text }}>
                                  {status} Companies
                                </h3>
                                <span 
                                  className="px-1.5 py-0.5 text-xs rounded-full"
                                  style={{ 
                                backgroundColor: theme === 'light' 
                                  ? status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)' 
                                  : status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                                color: status === 'Active' ? '#10B981' : '#6B7280'
                              }}
                            >
                              {statusCompanies.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-1 space-y-2">
                          <AnimatePresence>
                            {statusCompanies.map(company => (
                              <motion.div
                                key={company.id}
                                layoutId={`kanban-company-${company.id}`}
                                whileHover={{ 
                                  y: -2, 
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                  backgroundColor: theme === 'light' ? 'white' : '#1F2937'
                                }}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-3 rounded-lg mb-2 cursor-pointer border ${
                                  selectedCompanies.includes(company.id) ? 'ring-2' : ''
                                }`}
                                style={{
                                  backgroundColor: theme === 'light' ? 'white' : '#1F2937',
                                  borderColor: favoriteCompanies.includes(company.id) 
                                    ? `${colors.primary}80` 
                                    : colors.border,
                                  borderLeft: `3px solid ${getIndustryColor(company.industry).text}`,
                                  boxShadow: selectedCompanies.includes(company.id) 
                                    ? `0 0 0 2px ${colors.primary}` 
                                    : 'none'
                                }}
                                onClick={() => isSelectionMode 
                                  ? handleCompanySelection(company.id)
                                  : handleCompanyClick(company.id)
                                }
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex">
                                    {isSelectionMode && (
                                      <div 
                                        className="w-4 h-4 rounded mr-2 flex-shrink-0 mt-1"
                                        style={{ 
                                          backgroundColor: selectedCompanies.includes(company.id) 
                                            ? colors.primary 
                                            : theme === 'light' ? 'white' : colors.card,
                                          border: `1px solid ${selectedCompanies.includes(company.id) 
                                            ? colors.primary 
                                            : colors.border}`
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCompanySelection(company.id);
                                        }}
                                      >
                                        {selectedCompanies.includes(company.id) && (
                                          <div className="flex items-center justify-center h-full">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-sm flex items-center gap-1.5" style={{ color: colors.text }}>
                                        {company.name}
                                        {favoriteCompanies.includes(company.id) && (
                                          <svg 
                                            className="w-3.5 h-3.5" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20" 
                                            style={{ color: '#F59E0B' }}
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        )}
                                      </div>
                                      <div 
                                        className="inline-block px-1.5 py-0.5 rounded text-[10px] mt-1"
                                        style={{
                                          backgroundColor: getIndustryColor(company.industry).bg,
                                          color: getIndustryColor(company.industry).text
                                        }}
                                      >
                                        {company.industry}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs px-1.5 py-0.5 rounded-full" style={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                    color: colors.text
                                  }}>
                                    {company.openPositions} job{company.openPositions !== 1 && 's'}
                                  </div>
                                </div>
                                
                                <div className="text-xs" style={{ color: `${colors.text}90` }}>
                                  {company.contactPerson}
                                  {company.contactEmail && ` · ${company.contactEmail}`}
                                </div>
                                
                                <div className="flex justify-between items-center mt-2 pt-2 text-xs" style={{ 
                                  borderTop: `1px solid ${colors.border}20`,
                                  color: `${colors.text}70`
                                }}>
                                  <span>
                                    {formatRelativeDate(company.createdAt)}
                                  </span>
                                  
                                  <div className="flex gap-1">
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(company.id);
                                      }}
                                      className="p-1 rounded-full"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <svg 
                                        className="w-3.5 h-3.5" 
                                        fill={favoriteCompanies.includes(company.id) ? 'currentColor' : 'none'} 
                                        stroke="currentColor" 
                                        style={{ 
                                          color: favoriteCompanies.includes(company.id) ? '#F59E0B' : `${colors.text}60` 
                                        }}
                                        viewBox="0 0 24 24" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={favoriteCompanies.includes(company.id) ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                    </motion.button>
                                    
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCompany(company.id);
                                      }}
                                      className="p-1 rounded-full"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      style={{ color: '#EF4444' }}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            
                            {statusCompanies.length === 0 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                className="flex flex-col items-center justify-center py-8 text-center"
                                style={{ color: `${colors.text}60` }}
                              >
                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-xs">No {status.toLowerCase()} companies</p>
                                <button 
                                  className="mt-2 text-xs px-2 py-1 rounded"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                    color: colors.primary
                                  }}
                                  onClick={() => setShowCreateModal(true)}
                                >
                                  Add Company
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  </motion.div>

  {/* Company Detail Modal */}
  <CompanyDetailModal
    company={selectedCompany}
    isOpen={showDetailModal}
    onClose={() => setShowDetailModal(false)}
    onSave={handleSaveCompany}
    jobs={jobs || []}
  />

  {/* Create Company Modal */}
  <CompanyDetailModal
    company={null}
    isOpen={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    onSave={handleSaveCompany}
    isCreate={true}
  />
  
  {/* Export Modal */}
  <AnimatePresence>
    {showExportModal && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          style={{ backgroundColor: colors.card }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-medium" style={{ color: colors.text }}>Export Companies</h3>
              <p className="text-sm mt-1" style={{ color: `${colors.text}99` }}>
                Select options for exporting companies to CSV
              </p>
            </div>
            <motion.button
              onClick={() => setShowExportModal(false)}
              className="p-1 rounded-full"
              whileHover={{ backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              style={{ color: colors.text }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm" style={{ color: colors.primary }}>
                  {selectedCompanies.length > 0 
                    ? `You'll export ${selectedCompanies.length} selected companies` 
                    : `You'll export ${filteredCompanies.length} filtered companies`}
                </p>
              </div>
            </div>
            
            <TextArea
              label="Notes (optional)"
              placeholder="Add any export notes here..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExportCSV}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Export CSV
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
</AnimatePresence>
);
};
export default CompaniesPage;