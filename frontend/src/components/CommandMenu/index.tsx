import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import { useDataStore } from '@/store/useDataStore';
import { FiSearch, FiMail, FiMessageSquare, FiBriefcase, FiEdit,
  FiUsers, FiFileText, FiCpu, FiHelpCircle, FiX } from 'react-icons/fi';
import Button from '@/components/ui/Button';

// Import component types and constants
import { 
  Command, 
  CommandMenuProps, 
  CommandStep,
  CMD_SEARCH_CANDIDATE,
  CMD_SEARCH_COMPANY,
  CMD_GENERATE_EMAIL,
  CMD_GENERATE_SUGGESTIONS,
  CMD_GENERATE_INTERVIEW_QUESTIONS,
  CMD_GENERATE_JOB_DESCRIPTION,
  CMD_GENERATE_CANDIDATE_FEEDBACK,
  CMD_ANALYZE_CV,
  CMD_OPEN_CHAT
} from './types';

// Import extracted components
import CommandItem from './CommandItem';
import EntityItem from './EntityItem';
import SearchInput from './SearchInput';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onSelectCandidate,
  onSelectCompany,
  onInitiateEntitySelection,
  selectedEntity = null,
}) => {
  const { colors, theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the Zustand store
  const {
    candidates,
    companies,
    isLoadingCandidates,
    isLoadingCompanies,
    candidatesError,
    companiesError,
    fetchCandidates,
    fetchCompanies
  } = useDataStore();

  const [currentStep, setCurrentStep] = useState<CommandStep>('initial');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<any[]>([]);
  const [currentCommands, setCurrentCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch data immediately when the component mounts
  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
      fetchCompanies();
    }
  }, [isOpen, fetchCandidates, fetchCompanies]);

  const getAvailableCommands = useCallback((): Command[] => {
    // --- Action Definitions ---
    const actionSearchCandidate = () => {
      setCurrentStep('search_candidate');
      // Focus the search input after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    };
    
    const actionSearchCompany = () => {
      setCurrentStep('search_company');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    };
    
    const actionInitiateForEntity = (commandId: string, entityType: 'candidate' | 'company' | 'either' | null) => {
        onInitiateEntitySelection(entityType, commandId);
    };
    
    const actionOpenChat = () => {
        onInitiateEntitySelection(selectedEntity ? ('firstName' in selectedEntity ? 'candidate' : 'company') : null, CMD_OPEN_CHAT);
        onClose(); 
    };

    const baseCommands: Command[] = [
      { id: CMD_SEARCH_CANDIDATE, label: 'Search Candidate', description: 'Find and set context to a candidate', icon: <FiUsers size={18} />, action: actionSearchCandidate, requiresEntity: null },
      { id: CMD_SEARCH_COMPANY, label: 'Search Company', description: 'Find and set context to a company', icon: <FiBriefcase size={18} />, action: actionSearchCompany, requiresEntity: null },
    ];

    if (selectedEntity) {
      const entityType = 'firstName' in selectedEntity ? 'candidate' : 'company';
      const entityName = 'firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name;

      const contextualCommands: Command[] = [
        { id: CMD_GENERATE_EMAIL, label: `Email for ${entityName}`, description: `Draft an email for this ${entityType}`, icon: <FiMail size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_EMAIL, entityType), requiresEntity: entityType },
        { id: CMD_GENERATE_SUGGESTIONS, label: `Suggestions for ${entityName}`, description: `Get AI suggestions for this ${entityType}`, icon: <FiCpu size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_SUGGESTIONS, entityType), requiresEntity: entityType },
        { id: CMD_OPEN_CHAT, label: `Chat about ${entityName}`, description: `Discuss this ${entityType}`, icon: <FiMessageSquare size={18} />, action: actionOpenChat, requiresEntity: entityType },
      ];
      if (entityType === 'candidate') {
        contextualCommands.push(
          { id: CMD_GENERATE_CANDIDATE_FEEDBACK, label: `Feedback for ${entityName}`, description: 'Generate feedback', icon: <FiEdit size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_CANDIDATE_FEEDBACK, 'candidate'), requiresEntity: 'candidate' },
          { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: `Interview Qs for ${entityName}`, description: `For ${'firstName' in selectedEntity ? selectedEntity.position || 'their role' : 'their role'}`, icon: <FiHelpCircle size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, 'candidate'), requiresEntity: 'candidate' }
        );
      } else { // Company
        contextualCommands.push(
          { id: CMD_GENERATE_JOB_DESCRIPTION, label: `Job Desc for ${entityName}`, description: 'Draft a job description', icon: <FiFileText size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_JOB_DESCRIPTION, 'company'), requiresEntity: 'company' },
          { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: `Interview Qs (Company)`, description: `For roles at ${entityName}`, icon: <FiHelpCircle size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, 'company'), requiresEntity: 'company' }
        );
      }
      return [
        ...contextualCommands,
        ...baseCommands.map(cmd => ({...cmd, description: `Switch context / ${cmd.description}`}))
      ];
    }

    return [
      ...baseCommands,
      { id: CMD_ANALYZE_CV, label: 'Analyze CV', description: 'Extract info from pasted CV text', icon: <FiFileText size={18} />, action: () => actionInitiateForEntity(CMD_ANALYZE_CV, null), requiresEntity: null },
      { id: CMD_GENERATE_JOB_DESCRIPTION, label: 'Generic Job Description', description: 'Draft a generic job description', icon: <FiFileText size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_JOB_DESCRIPTION, null), requiresEntity: null },
      { id: CMD_GENERATE_INTERVIEW_QUESTIONS, label: 'Generic Interview Questions', description: 'Draft generic interview questions', icon: <FiHelpCircle size={18} />, action: () => actionInitiateForEntity(CMD_GENERATE_INTERVIEW_QUESTIONS, null), requiresEntity: null },
    ];
  }, [selectedEntity, onInitiateEntitySelection, onClose]);

  // Reset to initial step when the modal first opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('initial');
      setSearchTerm('');
      setCurrentCommands(getAvailableCommands());
      setSelectedIndex(0);
    }
  }, [isOpen, getAvailableCommands]);

  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Focus the search input when switching to search mode
  useEffect(() => {
    if (currentStep === 'search_candidate' || currentStep === 'search_company') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [currentStep]);

  // Filter entities based on search term and current step
  useEffect(() => {
    let newFiltered: any[] = [];
    
    if (currentStep === 'search_candidate') {
      if (!isLoadingCandidates && candidates.length > 0) {
        newFiltered = searchTerm
          ? candidates.filter(c => 
              `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
              (c.position && c.position.toLowerCase().includes(searchTerm.toLowerCase())))
          : candidates;
      }
    } else if (currentStep === 'search_company') {
      if (!isLoadingCompanies && companies.length > 0) {
        newFiltered = searchTerm
          ? companies.filter(c => 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())))
          : companies;
      }
    }
    
    setFilteredEntities(newFiltered);
    setSelectedIndex(0);
  }, [currentStep, searchTerm, candidates, companies, isLoadingCandidates, isLoadingCompanies]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let itemsForNav: any[] = currentCommands;
    if (currentStep === 'search_candidate' || currentStep === 'search_company') {
      itemsForNav = filteredEntities;
    }
    
    const currentListLength = itemsForNav.length || 0;
    if (currentListLength === 0 && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        e.preventDefault(); return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault(); setSelectedIndex(prev => (prev + 1) % currentListLength);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setSelectedIndex(prev => (prev - 1 + currentListLength) % currentListLength);
    } else if (e.key === 'Enter') {
      e.preventDefault(); handleItemSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (currentStep === 'initial') onClose();
      else setCurrentStep('initial');
    }
  };

  // Handle item selection
  const handleItemSelect = (indexToSelect?: number) => {
    const idx = typeof indexToSelect === 'number' ? indexToSelect : selectedIndex;

    if (currentStep === 'initial') {
      if (currentCommands[idx]) {
        const command = currentCommands[idx];
        command.action();
      }
    } else if (currentStep === 'search_candidate') {
      if (filteredEntities[idx]) {
        onSelectCandidate(filteredEntities[idx]);
        onClose(); // Close the modal after selection
      }
    } else if (currentStep === 'search_company') {
      if (filteredEntities[idx]) {
        onSelectCompany(filteredEntities[idx]);
        onClose(); // Close the modal after selection
      }
    }
  };  
  
  // Set index and trigger selection
  const handleClickSelect = (index: number) => {
    setSelectedIndex(index);
    handleItemSelect(index);
  };

  // Get title based on current step
  const renderTitle = () => {
    switch (currentStep) {
      case 'search_candidate': return 'Search Candidates';
      case 'search_company': return 'Search Companies';
      default: return 'AI Assistant Commands';
    }
  };

  // Render commands list
  const renderCommandList = () => (
    currentCommands.map((command, index) => (
      <CommandItem
        key={command.id + '-' + index}
        command={command}
        isSelected={selectedIndex === index}
        onClick={() => handleClickSelect(index)}
      />
    ))
  );

  // Render entity search results
  const renderEntityList = (entityType: 'candidate' | 'company') => {
    const isLoading = entityType === 'candidate' ? isLoadingCandidates : isLoadingCompanies;
    const error = entityType === 'candidate' ? candidatesError : companiesError;
    
    if (isLoading) {
      return <LoadingState entityType={entityType} />;
    }
    
    if (error) {
      return <ErrorState error={error} />;
    }
    
    if (filteredEntities.length === 0) {
      return <EmptyState type={entityType} searchTerm={searchTerm} />;
    }
    
    return filteredEntities.map((entity, index) => (
      <EntityItem
        key={entity.id}
        entity={entity}
        entityType={entityType}
        isSelected={selectedIndex === index}
        onClick={() => handleClickSelect(index)}
      />
    ));
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Main render
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Command Dialog */}
      <motion.div
        ref={menuRef}
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative z-10 p-0"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="command-menu-title"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <header className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: colors.border }}>
          <h3 id="command-menu-title" className="text-lg font-semibold" style={{ color: colors.text }}>
            {renderTitle()}
          </h3>
          <button
            className="p-1.5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose} 
            aria-label="Close command menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </header>

        {/* Search Input - Only shown for search steps */}
        {(currentStep === 'search_candidate' || currentStep === 'search_company') && (
          <div className="p-4 border-b" style={{ borderColor: colors.border }}>
            <SearchInput
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${currentStep === 'search_candidate' ? 'candidates' : 'companies'}...`}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="py-2 flex-1 overflow-y-auto" role="menu">
          {currentStep === 'initial' 
            ? renderCommandList()
            : currentStep === 'search_candidate'
              ? renderEntityList('candidate')
              : renderEntityList('company')}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t flex justify-between items-center flex-shrink-0" style={{ borderColor: colors.border }}>
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 'initial') onClose();
              else setCurrentStep('initial');
            }}  
            size="sm"
          >
            {currentStep === 'initial' ? 'Cancel' : 'Back'}
          </Button>
          <div className="text-xs opacity-60" style={{ color: colors.text }}>
            <span>&uarr;&darr; Navigate, Enter to select, Esc to {currentStep === 'initial' ? 'close' : 'back'}</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export { CommandMenu };
