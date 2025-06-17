// src/app/candidates/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import { apiService } from '@/lib';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Candidate } from '@/types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// UI Components
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import KanbanBoard, { KanbanCandidate, RecruitmentStage } from '@/components/ui/recruitment/KanbanBoard';
import CandidateDetailModal from '@/components/candidates/CandidateDetailModal';

// Icons - properly import all needed icons
import { 
  FiSearch, 
  FiPlus, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiRefreshCw, 
  FiUser, 
  FiBriefcase, 
  FiCalendar, 
  FiX,
  FiMail,
  FiStar,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiMessageCircle,
  FiPaperclip,
  FiCheckCircle,
  FiXCircle,
  FiUserPlus,
  FiClock
} from 'react-icons/fi';

type ViewMode = 'list' | 'kanban';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'rating_high' | 'rating_low';

// Create a dedicated ViewModeSwitcher component
interface ViewModeSwitcherProps {
  currentView: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  currentView,
  onChange,
  className = '',
}) => {
  const { colors, theme } = useTheme();
  
  // Handle keyboard navigation
  const handleKeyDown = (view: ViewMode) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(view);
    }
  };

  return (
    <div 
      className={`p-1 relative bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner ${className}`}
      role="tablist"
      aria-label="View mode selection"
    >
      {/* Sliding background element */}
      <motion.div
        className="absolute h-[calc(100%-8px)] top-1 rounded-lg shadow-sm z-0"
        style={{
          left: currentView === 'list' ? '4px' : '50%',
          width: 'calc(50% - 8px)',
          backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
        }}
        layout
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        aria-hidden="true"
      />

      {/* Button container */}
      {/* Each direct child of tablist must have role="tab" */}
      <motion.button
        className="flex items-center justify-center w-1/2 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all relative z-10"
        style={{ 
          color: currentView === 'list' ? colors.primary : `${colors.text}99`,
        }}
        whileHover={{ 
          scale: currentView === 'list' ? 1 : 1.05,
          backgroundColor: currentView === 'list' ? undefined : theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'
        }}
        whileTap={{ scale: currentView === 'list' ? 0.98 : 0.95 }}
        animate={{ 
          color: currentView === 'list' ? colors.primary : `${colors.text}99`,
        }}
        onClick={() => onChange('list')}
        onKeyDown={handleKeyDown('list')}
        role="tab"
        tabIndex={0}
        aria-selected={currentView === 'list'}
        aria-controls="list-view"
        id="list-tab"
      >
        <div className="relative flex items-center space-x-2">
          <span className={`relative ${currentView === 'list' ? 'text-primary' : ''}`}>
            <FiList className="w-5 h-5" />
            {currentView === 'list' && (
              <motion.span 
                className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              />
            )}
          </span>
          <span className={currentView === 'list' ? 'font-semibold' : ''}>List</span>
        </div>
      </motion.button>

      <motion.button
        className="flex items-center justify-center w-1/2 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all relative z-10"
        style={{ 
          color: currentView === 'kanban' ? colors.primary : `${colors.text}99`,
        }}
        whileHover={{ 
          scale: currentView === 'kanban' ? 1 : 1.05,
          backgroundColor: currentView === 'kanban' ? undefined : theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'
        }}
        whileTap={{ scale: currentView === 'kanban' ? 0.98 : 0.95 }}
        animate={{ 
          color: currentView === 'kanban' ? colors.primary : `${colors.text}99`,
        }}
        onClick={() => onChange('kanban')}
        onKeyDown={handleKeyDown('kanban')}
        role="tab"
        tabIndex={0}
        aria-selected={currentView === 'kanban'}
        aria-controls="kanban-view"
        id="kanban-tab"
      >
        <div className="relative flex items-center space-x-2">
          <span className={`relative ${currentView === 'kanban' ? 'text-primary' : ''}`}>
            <FiGrid className="w-5 h-5" />
            {currentView === 'kanban' && (
              <motion.span 
                className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              />
            )}
          </span>
          <span className={currentView === 'kanban' ? 'font-semibold' : ''}>Kanban</span>
        </div>
      </motion.button>
    </div>
  );
}

const CandidatesPage = () => {
  const { colors, theme } = useTheme();
  const user = useAuthStore(selectUser);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    position: [],
    rating: [],
    skills: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { data: candidates, loading, error, refetch } = useApiQuery<Candidate[]>(
    () => apiService.candidates.getAll(user?.role === 'super_admin' ? undefined : user?.officeId).then(res => res.items),
    [user?.officeId]
  );

  const metrics = useMemo(() => {
    if (!candidates) return { total: 0, new: 0, interview: 0, offer: 0 };

    return {
      total: candidates.length,
      new: candidates.filter((c) => c.status === 'new').length,
      interview: candidates.filter((c) => c.status === 'interview').length,
      offer: candidates.filter((c) => c.status === 'offer').length,
    };
  }, [candidates]);

  const filterOptions = useMemo(() => {
    if (!candidates)
      return {
        status: [],
        position: [],
        rating: [],
        skills: [],
      };

    const positions = Array.from(new Set(candidates.map((c) => c.position)));
    const skills = Array.from(new Set(candidates.flatMap((c) => 
      Array.isArray(c.tags) ? c.tags.map(tag => typeof tag === 'string' ? tag : tag.name || String(tag)) : []
    )));

    return {
      status: [
        { id: 'new', value: 'New' },
        { id: 'interview', value: 'Interview' },
        { id: 'offer', value: 'Offer' },
        { id: 'waiting', value: 'Waiting' },
        { id: 'hired', value: 'Hired' },
        { id: 'rejected', value: 'Rejected' },
      ],
      position: positions.map((pos) => ({ id: pos, value: pos })),
      rating: [
        { id: '5', value: '5 Stars' },
        { id: '4', value: '4 Stars' },
        { id: '3', value: '3 Stars' },
        { id: '2', value: '2 Stars' },
        { id: '1', value: '1 Star' },
      ],
      skills: skills.map((skill) => ({ id: String(skill), value: String(skill) })),
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];

    return candidates
      .filter((candidate) => {
        if (filters.status.length > 0 && !filters.status.some((f) => f.id === candidate.status)) {
          return false;
        }

        if (filters.position.length > 0 && !filters.position.some((f) => f.id === candidate.position)) {
          return false;
        }

        if (filters.rating.length > 0 && !filters.rating.some((f) => f.id === candidate.rating?.toString())) {
          return false;
        }

        if (filters.skills.length > 0 && !filters.skills.some((f) => {
          // Handle case where candidate.tags could be an array of strings or TagWithColor objects
          return candidate.tags.some(tag => 
            typeof tag === 'string' ? tag === f.id : tag.name === f.id || tag.id === f.id
          );
        })) {
          return false;
        }

        if (
          searchTerm &&
          !`${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'name_asc':
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          case 'name_desc':
            return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
          case 'rating_high':
            return (b.rating || 0) - (a.rating || 0);
          case 'rating_low':
            return (a.rating || 0) - (b.rating || 0);
          default:
            return 0;
        }
      });
  }, [candidates, filters, searchTerm, sortBy]);

  const kanbanCandidates = useMemo((): KanbanCandidate[] => {
    if (!filteredCandidates) return [];

    const statusToStageMap: Record<string, RecruitmentStage> = {
      new: 'received',
      interview: 'interview_planned',
      offer: 'interview_completed',
      waiting: 'client_waiting',
      hired: 'recruited',
      rejected: 'recruited',
    };

    return filteredCandidates
      .filter((candidate) => candidate.status !== 'rejected')
      .map((candidate) => ({
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        position: candidate.position,
        stage: statusToStageMap[candidate.status] || 'received',
        company: 'Company Name',
        date: candidate.updatedAt,
        assignedTo: candidate.assignedTo,
        tags: Array.isArray(candidate.tags) 
          ? candidate.tags.map(tag => typeof tag === 'string' ? tag : tag.name || String(tag)) 
          : undefined,
      }));
  }, [filteredCandidates]);

  const toggleFilter = (type: keyof FilterState, option: FilterOption) => {
    setFilters((prev) => {
      const current = prev[type];
      const exists = current.some((f) => f.id === option.id);

      return {
        ...prev,
        [type]: exists ? current.filter((f) => f.id !== option.id) : [...current, option],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      position: [],
      rating: [],
      skills: [],
    });
    setSearchTerm('');
  };

  const handleCandidateClick = (id: string) => {
    const candidate = candidates?.find((c) => c.id === id) || null;
    setSelectedCandidate(candidate);
    setShowDetailModal(true);
  };

  const handleStageChange = async (candidateId: string, newStage: RecruitmentStage) => {
    try {
      type CandidateStatus = 'new' | 'interview' | 'offer' | 'waiting' | 'hired' | 'rejected';

      const stageToStatusMap: Record<RecruitmentStage, CandidateStatus> = {
        received: 'new',
        interview_planned: 'interview',
        interview_completed: 'offer',
        client_waiting: 'waiting',
        recruited: 'hired',
      };

      await apiService.candidates.update(candidateId, {
        status: stageToStatusMap[newStage] as Candidate['status'],
      });

      refetch();
    } catch (error) {
      console.error('Failed to update candidate stage:', error);
    }
  };

  const handleSaveCandidate = async (candidate: Candidate) => {
    try {
      if (candidate.id.startsWith('temp-')) {
        await apiService.candidates.create(candidate);
      } else {
        await apiService.candidates.update(candidate.id, candidate);
      }

      refetch();
      setShowDetailModal(false);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to save candidate:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
        when: 'beforeChildren',
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
      },
    },
  };

  const filterVariants = {
    hidden: { height: 0, opacity: 0, overflow: 'hidden' },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { type: 'spring', stiffness: 300, damping: 25 },
        opacity: { duration: 0.3 },
      },
    },
  };

  if (error) {
    return (
      <motion.div
        className="p-6 text-center rounded-xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ backgroundColor: colors.card }}
      >
        <div className="mb-4">
          <motion.div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            initial={{ backgroundColor: '#FEE2E2' }}
            animate={{
              backgroundColor: ['#FEE2E2', '#FECACA', '#FEE2E2'],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </motion.div>
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
          Unable to Load Candidates
        </h3>
        <p className="mb-6 text-base" style={{ color: `${colors.text}99` }}>
          {error.message}
        </p>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="primary"
            onClick={() => refetch()}
            leftIcon={<FiRefreshCw className="w-5 h-5" />}
          >
            Try Again
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <LayoutGroup>
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.text }}>
              Candidates
            </h1>
            <p className="text-sm md:text-base" style={{ color: `${colors.text}88` }}>
              Manage your talent pipeline and recruitment progress
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {!showMobileSearch ? (
                <motion.div
                  className="flex md:hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="secondary"
                    leftIcon={<FiSearch className="w-5 h-5" />}
                    onClick={() => setShowMobileSearch(true)}
                    className="shadow-sm"
                  >
                    Search
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  className="flex md:hidden items-center gap-2 w-full"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 focus:ring-2 focus:ring-primary/20"
                      autoFocus
                      fullWidth
                      leftIcon={<FiSearch className="w-5 h-5 text-gray-400" />}
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-2 top-1/2 -mt-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setSearchTerm('')}
                      >
                        <FiX className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="!p-2.5 flex-shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowMobileSearch(false)}
                  >
                    <FiX className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="hidden md:block relative w-64">
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<FiSearch className="w-5 h-5 text-gray-400" />}
                className="focus:ring-2 focus:ring-primary/20 pr-10"
                fullWidth
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setSearchTerm('')}
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <motion.div 
              whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              whileTap={{ scale: 0.97 }}
              className="relative z-10"
            >
              <Button
                variant="primary"
                leftIcon={<FiPlus className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
                className="shadow-sm font-medium"
                style={{ 
                  background: `linear-gradient(45deg, ${colors.primary}, ${colors.primary}dd)`,
                }}
              >
                <span>Add Candidate</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
          <motion.div 
            className="rounded-xl p-4 h-full"
            style={{ backgroundColor: colors.card }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: `${colors.text}88` }}>
                  Total Candidates
                </p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {loading ? (
                    <motion.div 
                      className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      animate={{ opacity: [0.7, 0.9, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  ) : metrics.total}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg" style={{ 
                backgroundColor: `${colors.primary}15`,
                boxShadow: `0 0 0 1px ${colors.primary}15 inset`
              }}>
                <FiUser className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-4 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary, width: '100%' }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl p-4 h-full"
            style={{ backgroundColor: colors.card }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: `${colors.text}88` }}>
                  New Candidates
                </p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {loading ? '...' : metrics.new}
                </h3>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `#3B82F620` }}>
                <FiPlus className="w-6 h-6" style={{ color: '#3B82F6' }} />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: '#3B82F6',
                  width: `${metrics.total ? (metrics.new / metrics.total) * 100 : 0}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.total ? (metrics.new / metrics.total) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl p-4 h-full"
            style={{ backgroundColor: colors.card }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: `${colors.text}88` }}>
                  In Interview
                </p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {loading ? '...' : metrics.interview}
                </h3>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `#F59E0B20` }}>
                <FiCalendar className="w-6 h-6" style={{ color: '#F59E0B' }} />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  width: `${metrics.total ? (metrics.interview / metrics.total) * 100 : 0}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.total ? (metrics.interview / metrics.total) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl p-4 h-full"
            style={{ backgroundColor: colors.card }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: `${colors.text}88` }}>
                  Offers Out
                </p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {loading ? '...' : metrics.offer}
                </h3>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `#10B98120` }}>
                <FiBriefcase className="w-6 h-6" style={{ color: '#10B981' }} />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: '#10B981',
                  width: `${metrics.total ? (metrics.offer / metrics.total) * 100 : 0}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.total ? (metrics.offer / metrics.total) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={showFilters ? 'primary' : 'outline'}
                    leftIcon={<FiFilter className="w-5 h-5" />}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`font-medium ${showFilters ? 'shadow-sm' : 'border-2'}`}
                  >
                    {showFilters ? 'Hide Filters' : 'Filters'}
                    {Object.values(filters).flat().length > 0 && (
                      <span 
                        className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/90 dark:bg-gray-800/90 inline-flex items-center justify-center min-w-[20px]"
                        style={{ color: colors.primary, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
                      >
                        {Object.values(filters).flat().length}
                      </span>
                    )}
                  </Button>
                </motion.div>

                <div className="flex items-center">
                  <span className="mr-2 text-sm" style={{ color: `${colors.text}88` }}>
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="rounded-md text-sm py-1.5 px-3 cursor-pointer shadow-sm"
                    style={{
                      backgroundColor: theme === 'light' ? 'white' : '#374151',
                      color: colors.text,
                      borderColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${encodeURIComponent(theme === 'light' ? '#6B7280' : '#9CA3AF')}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                      border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="rating_high">Highest Rating</option>
                    <option value="rating_low">Lowest Rating</option>
                  </select>
                </div>

                {Object.values(filters).flat().length > 0 && (
                  <motion.button
                    className="text-sm px-2 py-1 rounded"
                    onClick={clearFilters}
                    style={{ color: colors.primary }}
                    whileHover={{ backgroundColor: `${colors.primary}15` }}
                    transition={{ duration: 0.2 }}
                  >
                    Clear all filters
                  </motion.button>
                )}
              </div>

              <ViewModeSwitcher
                currentView={viewMode}
                onChange={setViewMode}
                className="w-full md:w-auto min-w-[200px]"
              />
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial="hidden" animate="visible" exit="hidden" variants={filterVariants}>
                  <div
                    className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                    style={{ borderColor: colors.border }}
                  >
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Status
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.status.map((option) => (
                          <FilterChip
                            key={String(option.id)}
                            label={String(option.value)}
                            active={filters.status.some((f) => f.id === option.id)}
                            onClick={() => toggleFilter('status', option)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Position
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.position.slice(0, 8).map((option) => (
                          <FilterChip
                            key={String(option.id)}
                            label={String(option.value)}
                            active={filters.position.some((f) => f.id === option.id)}
                            onClick={() => toggleFilter('position', option)}
                          />
                        ))}
                        {filterOptions.position.length > 8 && (
                          <button
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ color: colors.primary }}
                          >
                            +{filterOptions.position.length - 8} more
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Rating
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.rating.map((option) => (
                          <FilterChip
                            key={String(option.id)}
                            label={String(option.value)}
                            active={filters.rating.some((f) => f.id === option.id)}
                            onClick={() => toggleFilter('rating', option)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.skills.slice(0, 8).map((option) => (
                          <FilterChip
                            key={String(option.id)}
                            label={String(option.value)}
                            active={filters.skills.some((f) => f.id === option.id)}
                            onClick={() => toggleFilter('skills', option)}
                          />
                        ))}
                        {filterOptions.skills.length > 8 && (
                          <button
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ color: colors.primary }}
                          >
                            +{filterOptions.skills.length - 8} more
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {Object.values(filters).flat().length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(filters).map(([type, options]) =>
                  options.map((option: FilterOption) => (
                    <motion.div
                      key={`${type}-${option.id}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary,
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                      }}
                    >
                      <span className="mr-1 opacity-70">
                        {type.charAt(0).toUpperCase() + type.slice(1)}:
                      </span>
                      <span className="font-medium">{option.value}</span>
                      <button
                        className="ml-1.5 p-0.5 rounded-full hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors"
                        onClick={() => toggleFilter(type as keyof FilterState, option)}
                        aria-label={`Remove ${option.value} filter`}
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
                
                <motion.button
                  className="flex items-center px-2.5 py-1 text-xs rounded-full transition-colors ml-1"
                  style={{
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    color: `${colors.text}99`
                  }}
                  whileHover={{ 
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                  }}
                  onClick={clearFilters}
                >
                  <FiX className="w-3.5 h-3.5 mr-1" />
                  <span>Clear all</span>
                </motion.button>
              </div>
            )}
          </Card>
        </motion.div>

        {loading && (
          <motion.div
            className="flex justify-center items-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-16 h-16">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-transparent"
                style={{ borderColor: `${colors.primary}40`, borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent"
                style={{
                  borderColor: colors.primary,
                  borderTopColor: 'transparent',
                  borderLeftColor: 'transparent',
                }}
                animate={{ rotate: 720 }}
                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div
                key="list-view"
                id="list-view"
                role="tabpanel"
                aria-labelledby="list-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {filteredCandidates.length === 0 ? (
                  <EmptyState setShowCreateModal={setShowCreateModal} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCandidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onClick={() => handleCandidateClick(candidate.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="kanban-view"
                id="kanban-view"
                role="tabpanel"
                aria-labelledby="kanban-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <KanbanBoard
                  candidates={kanbanCandidates}
                  onCandidateClick={handleCandidateClick}
                  onStageChange={handleStageChange}
                  loading={loading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSave={handleSaveCandidate}
      />

      <CandidateDetailModal
        candidate={null}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveCandidate}
        isCreate={true}
      />
    </LayoutGroup>
  );
};

interface FilterOption {
  id: string;
  value: string;
}

interface FilterState {
  status: FilterOption[];
  position: FilterOption[];
  rating: FilterOption[];
  skills: FilterOption[];
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => {
  const { colors } = useTheme();

  return (
    <motion.button
      className={`text-xs px-2 py-1 rounded-full transition-colors ${active ? 'font-medium' : ''}`}
      style={{
        backgroundColor: active ? `${colors.primary}20` : `${colors.text}10`,
        color: active ? colors.primary : `${colors.text}99`,
      }}
      whileHover={{
        backgroundColor: active ? `${colors.primary}30` : `${colors.text}20`,
        scale: 1.05,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
};

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onClick }) => {
  const { colors, theme } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle action clicks separately from card click
  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setShowActions(false);
    
    // You can implement these actions later
    console.log(`Action ${action} for candidate ${candidate.id}`);
    
    // For future implementation:
    // switch (action) {
    //   case 'edit': navigate to edit page or open edit modal; break;
    //   case 'message': openMessageDialog(candidate.id); break;
    //   ...etc
    // }
  };

  // Define status colors for different candidate states
  const statusColors: Record<string, { bg: string; text: string }> = {
    new: { bg: '#3B82F620', text: '#3B82F6' },
    interview: { bg: '#8B5CF620', text: '#8B5CF6' },
    offer: { bg: '#F59E0B20', text: '#F59E0B' },
    waiting: { bg: '#6366F120', text: '#6366F1' },
    hired: { bg: '#10B98120', text: '#10B981' },
    rejected: { bg: '#EF444420', text: '#EF4444' },
  };
  
  // Predefined tag colors for different skill categories
  const tagColorMap: Record<string, { bg: string, text: string }> = {
    // Programming Languages
    'JavaScript': { bg: '#F7DF1E20', text: '#B59516' },
    'TypeScript': { bg: '#3178C620', text: '#3178C6' },
    'Python': { bg: '#3776AB20', text: '#3776AB' },
    'Java': { bg: '#EC242420', text: '#EC2424' },
    'PHP': { bg: '#777BB420', text: '#777BB4' },
    'Go': { bg: '#00ADD820', text: '#00ADD8' },
    'C#': { bg: '#68217A20', text: '#68217A' },
    'Ruby': { bg: '#CC342D20', text: '#CC342D' },
    // Frameworks
    'React': { bg: '#61DAFB20', text: '#149ECA' },
    'Node.js': { bg: '#43853D20', text: '#43853D' },
    'Angular': { bg: '#DD003120', text: '#DD0031' },
    'Vue.js': { bg: '#4FC08D20', text: '#4FC08D' },
    'Express': { bg: '#68A06320', text: '#68A063' },
    'Django': { bg: '#09683520', text: '#096835' },
    // Soft skills
    'Leadership': { bg: '#8B5CF620', text: '#8B5CF6' },
    'Communication': { bg: '#F97316', text: '#F97316' },
    'Teamwork': { bg: '#EC489920', text: '#EC4899' },
    'Problem Solving': { bg: '#F59E0B20', text: '#F59E0B' },
  };
  
  // Function to generate consistent color from string
  const getTagColor = (tag: string): { bg: string, text: string } => {
    // Check if we have a predefined color for this tag
    const knownTag = Object.entries(tagColorMap)
      .find(([key]) => key.toLowerCase() === tag.toLowerCase());
    
    if (knownTag) {
      return knownTag[1];
    }
    
    // Otherwise generate a color based on string
    const hue = Math.abs(
      tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % 360;
    
    // Different color palettes for light and dark themes
    if (theme === 'light') {
      return {
        bg: `hsla(${hue}, 70%, 50%, 0.12)`,
        text: `hsl(${hue}, 70%, 35%)`
      };
    } else {
      return {
        bg: `hsla(${hue}, 70%, 40%, 0.15)`,
        text: `hsl(${hue}, 70%, 65%)`
      };
    }
  };
  
  // Generate gradient based on candidate name
  const getInitialsGradient = () => {
    const firstName = candidate.firstName.toLowerCase();
    const lastName = candidate.lastName.toLowerCase();
    const charSum = [...firstName, ...lastName].reduce(
      (sum, char) => sum + char.charCodeAt(0), 0
    );
    
    const hue1 = charSum % 360;
    const hue2 = (hue1 + 40) % 360;
    
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 75%, 50%))`;
  };

  // Generate user avatar color from name
  const getUserColor = (name: string) => {
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hue = charSum % 360;
    return `hsl(${hue}, 75%, ${theme === 'light' ? '45%' : '65%'})`;
  };

  return (
    <motion.div
      className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: colors.card }}
      whileHover={{ y: -4, boxShadow: '0 12px 25px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      layout
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 shadow-sm"
              style={{ background: getInitialsGradient() }}
            >
              {candidate.firstName[0]}
              {candidate.lastName[0]}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: colors.text }}>
                {candidate.firstName} {candidate.lastName}
              </h3>
              <p className="text-sm" style={{ color: `${colors.text}88` }}>
                {candidate.position}
              </p>
            </div>
          </div>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: statusColors[candidate.status]?.bg || `${colors.text}20`,
              color: statusColors[candidate.status]?.text || colors.text,
            }}
          >
            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
          </div>
        </div>

        <div className="flex items-center text-sm mb-3" style={{ color: `${colors.text}88` }}>
          <FiMail className="w-4 h-4 mr-1" />
          {candidate.email}
        </div>

        <div className="mb-3">
          <div className="flex items-center mb-1">
            <span className="text-xs mr-2" style={{ color: `${colors.text}88` }}>
              Rating:
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className="w-4 h-4"
                  fill={star <= (candidate.rating || 0) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  style={{
                    color: star <= (candidate.rating || 0) ? '#F59E0B' : '#D1D5DB',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-xs mr-2" style={{ color: `${colors.text}88` }}>
              Added:
            </span>
            <span className="text-xs" style={{ color: colors.text }}>
              {new Date(candidate.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {candidate.tags && candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {candidate.tags.slice(0, 3).map((tag, index) => {
              // Handle different tag formats
              const tagName = typeof tag === 'string' ? tag : tag.name || String(tag);
              // Get color from tag object or generate based on tag name
              const tagColor = typeof tag === 'object' && tag.color 
                ? { bg: `${tag.color}20`, text: tag.color }
                : getTagColor(tagName);
              
              return (
                <span
                  key={typeof tag === 'string' ? tag : (tag.id || `tag-${index}`)}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                  style={{ 
                    backgroundColor: tagColor.bg,
                    color: tagColor.text,
                    borderColor: `${tagColor.text}25`,
                  }}
                >
                  {tagName}
                </span>
              );
            })}
            {candidate.tags.length > 3 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                style={{ 
                  backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                  color: `${colors.text}99`
                }}
              >
                +{candidate.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className="p-3 flex justify-between items-center gap-2"
        style={{
          backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        {/* Assigned User Section */}
        <div className="flex items-center flex-1 min-w-0">
          {candidate.assignedTo ? (
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden flex-shrink-0"
                style={{ backgroundColor: getUserColor(candidate.assignedTo) }}
                title={`Assigned to ${candidate.assignedTo}`}
              >
                {candidate.assignedTo.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm truncate" style={{ color: colors.text }}>
                {candidate.assignedTo}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-sm" style={{ color: `${colors.text}60` }}>
              <FiUserPlus className="w-4 h-4 mr-1.5" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center mr-1">
          <motion.div 
            className="w-2 h-2 rounded-full" 
            style={{ 
              backgroundColor: candidate.status === 'new' ? '#3B82F6' :
                             candidate.status === 'interview' ? '#8B5CF6' :
                             candidate.status === 'offer' ? '#F59E0B' :
                             candidate.status === 'hired' ? '#10B981' :
                             candidate.status === 'waiting' ? '#6366F1' : '#EF4444'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
          <motion.div
            className="ml-2 text-xs font-medium hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: `${colors.text}99` }}
          >
            <FiClock className="w-3.5 h-3.5 inline mr-1 opacity-60" />
            {new Date(candidate.updatedAt).toLocaleDateString()}
          </motion.div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2">
          {/* View Details Button */}
          <motion.button
            className="text-xs px-3 py-1.5 rounded-md flex items-center font-medium"
            style={{ 
              background: theme === 'light' 
                ? `linear-gradient(to right, ${colors.primary}, ${colors.primary}dd)` 
                : `linear-gradient(to right, ${colors.primary}bb, ${colors.primary})`,
              color: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            whileHover={{ 
              scale: 1.03,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View
            <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* More Actions Button */}
          <div className="relative" ref={actionsRef}>
            <motion.button
              className={`p-1.5 rounded-md flex items-center justify-center ${showActions ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              aria-label="More actions"
              style={{ color: colors.text }}
            >
              <FiMoreHorizontal className="w-4 h-4" />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  className="absolute right-0 bottom-full mb-1 z-10 w-48 rounded-lg shadow-lg py-1 overflow-hidden"
                  style={{ 
                    backgroundColor: theme === 'light' ? 'white' : '#1F2937',
                    border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                  }}
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.text }}
                    onClick={(e) => handleActionClick(e, 'edit')}
                  >
                    <FiEdit className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                    Edit Candidate
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.text }}
                    onClick={(e) => handleActionClick(e, 'message')}
                  >
                    <FiMessageCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Send Message
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: colors.text }}
                    onClick={(e) => handleActionClick(e, 'document')}
                  >
                    <FiPaperclip className="w-4 h-4 mr-2 text-amber-500" />
                    Attach Document
                  </button>
                  {candidate.status !== 'hired' && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      style={{ color: '#10B981' }}
                      onClick={(e) => handleActionClick(e, 'hire')}
                    >
                      <FiCheckCircle className="w-4 h-4 mr-2" />
                      Mark as Hired
                    </button>
                  )}
                  {candidate.status !== 'rejected' && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      style={{ color: '#EF4444' }}
                      onClick={(e) => handleActionClick(e, 'reject')}
                    >
                      <FiXCircle className="w-4 h-4 mr-2" />
                      Mark as Rejected
                    </button>
                  )}
                  <div className="border-t my-1" style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#374151' }} />
                  <button
                    className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: '#DC2626' }}
                    onClick={(e) => handleActionClick(e, 'delete')}
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete Candidate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ setShowCreateModal }: { setShowCreateModal: (value: boolean) => void }) => {
  const { colors } = useTheme();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style={{ backgroundColor: colors.card }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner"
        style={{ backgroundColor: `${colors.primary}15` }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <FiSearch className="w-8 h-8" style={{ color: colors.primary }} />
      </motion.div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
        No candidates found
      </h3>
      <p className="text-sm max-w-md mb-6" style={{ color: `${colors.text}88` }}>
        We couldn&rsquo;t find any candidates matching your filters. Try adjusting your filters or add a new candidate.
      </p>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button
          variant="primary"
          leftIcon={<FiPlus className="w-5 h-5" />}
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 shadow"
          style={{ 
            background: `linear-gradient(45deg, ${colors.primary}, ${colors.primary}dd)`,
          }}
        >
          Add New Candidate
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CandidatesPage;