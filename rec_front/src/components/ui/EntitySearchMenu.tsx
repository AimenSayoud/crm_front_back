// src/components/ui/EntitySearchMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Candidate, Company } from '@/types';

interface EntitySearchMenuProps {
  isOpen: boolean;
  type: 'candidates' | 'companies';
  entities: (Candidate | Company)[];
  onSelect: (entity: Candidate | Company) => void;
  onClose: () => void;
}

const EntitySearchMenu: React.FC<EntitySearchMenuProps> = ({
  isOpen,
  type,
  entities,
  onSelect,
  onClose,
}) => {
  const { colors, theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<(Candidate | Company)[]>(entities);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter entities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntities(entities);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = entities.filter(entity => {
      if (type === 'candidates') {
        const candidate = entity as Candidate;
        return (
          (candidate.firstName?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.lastName?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.email?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.position?.toLowerCase() || '').includes(lowerSearchTerm)
        );
      } else {
        const company = entity as Company;
        return (
          (company.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (company.industry?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (company.contactPerson?.toLowerCase() || '').includes(lowerSearchTerm) ||
          ((company.contactEmail?.toLowerCase() || '').includes(lowerSearchTerm))
        );
      }
    });

    setFilteredEntities(filtered);
    setSelectedIndex(0);
  }, [searchTerm, entities, type]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredEntities.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredEntities.length) % filteredEntities.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEntities[selectedIndex]) {
        onSelect(filteredEntities[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Render a candidate item
  const renderCandidateItem = (candidate: Candidate, index: number) => (
    <motion.div
      key={candidate.id}
      className={`px-3 py-2 flex items-center cursor-pointer ${
        index === selectedIndex ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
      }`}
      style={{ 
        backgroundColor: index === selectedIndex 
          ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
          : 'transparent' 
      }}
      whileHover={{
        backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
      }}
      onClick={() => onSelect(candidate)}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
        style={{ 
          backgroundColor: colors.primary
        }}
      >
        {(candidate.firstName?.charAt(0) || '') + (candidate.lastName?.charAt(0) || '')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm flex items-center" style={{ color: colors.text }}>
          {candidate.firstName || 'No First Name'} {candidate.lastName || 'No Last Name'}
          {candidate.status && (
            <Badge
              variant={
                candidate.status === 'hired' ? 'success' :
                candidate.status === 'rejected' ? 'danger' :
                candidate.status === 'offer' ? 'warning' :
                'primary'
              }
              className="ml-2 text-[10px] py-0.5 px-1.5"
            >
              {candidate.status}
            </Badge>
          )}
        </div>
        <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
          {candidate.position || 'No Position'} • {candidate.email || 'No Email'}
        </div>
      </div>
    </motion.div>
  );

  // Render a company item
  const renderCompanyItem = (company: Company, index: number) => (
    <motion.div
      key={company.id}
      className={`px-3 py-2 flex items-center cursor-pointer ${
        index === selectedIndex ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
      }`}
      style={{ 
        backgroundColor: index === selectedIndex 
          ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
          : 'transparent' 
      }}
      whileHover={{
        backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
      }}
      onClick={() => onSelect(company)}
    >
      <div 
        className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
        style={{ 
          backgroundColor: colors.secondary
        }}
      >
        {company.name?.charAt(0) || 'C'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm" style={{ color: colors.text }}>
          {company.name || 'Unnamed Company'}
        </div>
        <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
          {company.industry || 'No Industry'} • {typeof company.openPositions === 'number' ? `${company.openPositions} position${company.openPositions !== 1 ? 's' : ''}` : 'No open positions'}
        </div>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="absolute bottom-full left-4 mb-2 w-80 shadow-lg rounded-md overflow-hidden z-10"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div className="p-2 border-b" style={{ borderColor: colors.border }}>
          <p className="text-xs mb-2" style={{ color: `${colors.text}80` }}>
            Search {type === 'candidates' ? 'Candidates' : 'Companies'}
          </p>
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${type === 'candidates' ? 'candidates' : 'companies'}...`}
            fullWidth
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="py-1 max-h-60 overflow-y-auto">
          {filteredEntities.length > 0 ? (
            filteredEntities.map((entity, index) => (
              type === 'candidates' 
                ? renderCandidateItem(entity as Candidate, index) 
                : renderCompanyItem(entity as Company, index)
            ))
          ) : (
            <div className="px-3 py-4 text-center" style={{ color: `${colors.text}60` }}>
              <p>No results found</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EntitySearchMenu;