// src/components/ui/SimpleSearchMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Input from '@/components/ui/Input';
import { Candidate, Company } from '@/types';
import { FiSearch, FiUsers, FiBriefcase, FiX, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Button from './Button';

interface SimpleSearchMenuProps {
  isOpen: boolean;
  type: 'candidates' | 'companies';
  items: (Candidate | Company)[];
  isLoading?: boolean;
  error?: string | null;
  onSelect: (item: Candidate | Company) => void;
  onClose: () => void;
  title?: string;
}

const SimpleSearchMenu: React.FC<SimpleSearchMenuProps> = ({
  isOpen,
  type,
  items,
  isLoading = false,
  error = null,
  onSelect,
  onClose,
  title,
}) => {
  const { colors, theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<(Candidate | Company)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  console.log("SimpleSearchMenu items:", items.length);
  console.log("SimpleSearchMenu is loading:", isLoading);
  console.log("SimpleSearchMenu is open:", isOpen);

  // Reset search when menu opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      
      // Focus the input after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle clicks outside the menu
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

  // Filter items based on search term
  useEffect(() => {
    if (isLoading || error) {
      setFilteredItems([]);
      return;
    }

    let filtered: (Candidate | Company)[] = [];
    
    if (type === 'candidates') {
      filtered = searchTerm
        ? (items as Candidate[]).filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.position && c.position.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : items;
    } else {
      filtered = searchTerm
        ? (items as Company[]).filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : items;
    }
    
    console.log("Filtered items:", filtered.length);
    setFilteredItems(filtered);
    setSelectedIndex(0); // Reset selection when filter changes
  }, [items, searchTerm, type, isLoading, error]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const itemCount = filteredItems.length;
    
    // Ignore navigation keys if no items
    if (itemCount === 0 && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % itemCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      onSelect(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Handle item selection by click
  const handleItemClick = (item: Candidate | Company) => {
    onSelect(item);
  };

  // No need to render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={menuRef}
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: colors.border }}>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            {title || (type === 'candidates' ? 'Search Candidates' : 'Search Companies')}
          </h3>
          <button
            className="p-1.5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="Close search menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </header>

        {/* Search Input */}
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${type === 'candidates' ? 'candidates' : 'companies'}...`}
            fullWidth
            leftIcon={<FiSearch className="w-4 h-4 text-gray-400" />}
            className="text-base"
          />
        </div>

        {/* List of Items */}
        <div className="py-2 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center flex flex-col items-center justify-center" style={{ color: `${colors.text}99` }}>
              <FiLoader className="w-8 h-8 mb-3 animate-spin" style={{ color: colors.primary }} />
              <p className="font-medium">Loading {type === 'candidates' ? 'candidates' : 'companies'}...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center flex flex-col items-center justify-center" style={{ color: colors.text }}>
              <FiAlertCircle className="w-10 h-10 mb-3 text-red-500" />
              <p className="font-medium text-red-600 dark:text-red-400">Error loading data</p>
              <p className="text-sm opacity-70 mt-1">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: `${colors.text}99` }}>
              <div className="motion-safe:animate-fadeIn">
                <FiSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {searchTerm
                    ? `No ${type === 'candidates' ? 'candidates' : 'companies'} found for "${searchTerm}"`
                    : `No ${type === 'candidates' ? 'candidates' : 'companies'} available`}
                </p>
                <p className="text-sm opacity-70">
                  {searchTerm ? 'Try a different search term.' : 'There are no items to display.'}
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isCandidate = type === 'candidates';
              const candidate = isCandidate ? (item as Candidate) : null;
              const company = !isCandidate ? (item as Company) : null;

              return (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-center cursor-pointer rounded-lg mx-2 my-1 transition-colors duration-150`}
                  style={{
                    backgroundColor: selectedIndex === index ? (theme === 'light' ? `${colors.primary}1A` : `${colors.primary}33`) : 'transparent',
                    color: selectedIndex === index ? colors.primary : colors.text,
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 text-white font-medium ${isCandidate ? 'rounded-full' : 'rounded-md'}`}
                    style={{ backgroundColor: isCandidate ? colors.primary : colors.secondary }}
                  >
                    {isCandidate
                      ? `${candidate?.firstName?.[0]}${candidate?.lastName?.[0]}`
                      : company?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {isCandidate
                        ? `${candidate?.firstName} ${candidate?.lastName}`
                        : company?.name}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {isCandidate
                        ? `${candidate?.position || 'No position'} · ${candidate?.email || 'No email'}`
                        : `${company?.industry || 'No industry'} · ${company?.contactPerson || 'No contact'}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t flex justify-between items-center flex-shrink-0" style={{ borderColor: colors.border }}>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <div className="text-xs opacity-60" style={{ color: colors.text }}>
            <span>&uarr;&darr; Navigate, Enter to select, Esc to close</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SimpleSearchMenu;