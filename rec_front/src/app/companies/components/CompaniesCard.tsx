'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/types';
import { FiEye, FiEdit, FiTrash2, FiMoreVertical, FiUsers, FiMail, FiGlobe } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

interface CompaniesCardProps {
  companies: Company[];
  viewMode: 'list' | 'cards' | 'kanban';
  onCompanyAction: (companyId: string, action: 'view' | 'edit' | 'delete') => void;
}

const CompaniesCard: React.FC<CompaniesCardProps> = ({
  companies,
  viewMode,
  onCompanyAction,
}) => {
  const { colors, theme } = useTheme();

  // Get theme-based colors for industry badges
  const getIndustryColor = () => {
    return {
      bg: theme === 'light' ? `${colors.primary}10` : `${colors.primary}20`,
      text: colors.primary,
      border: theme === 'light' ? `${colors.primary}30` : `${colors.primary}40`
    };
  };

  // Format company size
  const formatCompanySize = (employees: number) => {
    if (employees < 10) return '1-10';
    if (employees < 50) return '11-50';
    if (employees < 200) return '51-200';
    if (employees < 500) return '201-500';
    return '500+';
  };

  // Cards View Content
  const CompanyCardsContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {companies.map((company, index) => (
        <motion.div
          key={company.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group relative rounded-2xl border p-6 cursor-pointer flex flex-col"
          style={{ 
            backgroundColor: colors.card,
            borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
            boxShadow: theme === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)',
            height: '400px',
            width: '100%'
          }}
          onClick={() => onCompanyAction(company.id, 'view')}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6 flex-shrink-0">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: colors.primary,
                  color: 'white'
                }}
              >
                {company.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate" style={{ color: colors.text }}>
                  {company.name}
                </h3>
              </div>
            </div>
            <div className="flex-shrink-0 ml-2">
              <CompanyActionMenu company={company} onAction={onCompanyAction} />
            </div>
          </div>

          {/* Industry Badge */}
          <div className="mb-4 flex-shrink-0">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: getIndustryColor().bg,
                color: getIndustryColor().text,
                border: `1px solid ${getIndustryColor().border}`
              }}
            >
              {company.industry}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 text-sm">
            <div className="flex items-center space-x-3" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              <HiOutlineOfficeBuilding className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{formatCompanySize(50)} employees</span>
            </div>
            
            <div className="flex items-center space-x-3" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              <FiUsers className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{company.openPositions} open positions</span>
            </div>

            <div className="flex items-center space-x-3" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              <FiMail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{company.contactPerson}</span>
            </div>

            {company.website && (
              <div className="flex items-center space-x-3" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                <FiGlobe className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{company.website}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t flex-shrink-0" style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563' }}>
            <p className="text-xs" style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
              Added {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // List View Content
  const CompanyListContent = () => (
    <div className="space-y-3">
      {companies.map((company, index) => (
        <motion.div
          key={company.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.02 }}
          whileHover={{ x: 4, transition: { duration: 0.2 } }}
          className="group relative rounded-xl border p-4 cursor-pointer"
          style={{ 
            backgroundColor: colors.card,
            borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
            boxShadow: theme === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
          }}
          onClick={() => onCompanyAction(company.id, 'view')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: colors.primary,
                  color: 'white'
                }}
              >
                {company.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold text-base truncate" style={{ color: colors.text }}>
                    {company.name}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: getIndustryColor().bg,
                      color: getIndustryColor().text,
                      border: `1px solid ${getIndustryColor().border}`
                    }}
                  >
                    {company.industry}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  <span className="flex items-center space-x-1">
                    <FiUsers className="w-3 h-3" />
                    <span>{formatCompanySize(50)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HiOutlineOfficeBuilding className="w-3 h-3" />
                    <span>{company.openPositions} positions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiMail className="w-3 h-3" />
                    <span className="truncate">{company.contactPerson}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-4">
              <CompanyActionMenu company={company} onAction={onCompanyAction} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Kanban View Content
  const CompanyKanbanContent = () => {
    const statusColumns = [
      { id: 'active', title: 'Active', companies: companies.filter(c => c.openPositions > 0) },
      { id: 'inactive', title: 'Inactive', companies: companies.filter(c => c.openPositions === 0) },
    ];

    return (
      <div className="flex gap-6 min-h-[450px]">
        {statusColumns.map((column) => (
          <div key={column.id} className="flex-1">
            <div 
              className="rounded-xl border p-4 h-full"
              style={{ 
                backgroundColor: colors.card,
                borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg" style={{ color: colors.text }}>
                  {column.title}
                </h3>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${colors.primary}20`,
                    color: colors.primary
                  }}
                >
                  {column.companies.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {column.companies.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="group relative rounded-lg border p-3 cursor-pointer"
                    style={{ 
                      backgroundColor: colors.card,
                      borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                      borderLeft: `3px solid ${colors.primary}`
                    }}
                    onClick={() => onCompanyAction(company.id, 'view')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: colors.primary,
                            color: 'white'
                          }}
                        >
                          {company.name.charAt(0)}
                        </div>
                        <h4 className="font-medium text-sm truncate" style={{ color: colors.text }}>
                          {company.name}
                        </h4>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <CompanyActionMenu company={company} onAction={onCompanyAction} compact isKanban />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      <div className="flex items-center justify-between">
                        <span>{company.industry}</span>
                        <span>{company.openPositions} positions</span>
                      </div>
                      <div className="truncate">{company.contactPerson}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  switch (viewMode) {
    case 'cards':
      return <CompanyCardsContent />;
    case 'list':
      return <CompanyListContent />;
    case 'kanban':
      return <CompanyKanbanContent />;
    default:
      return <CompanyCardsContent />;
  }
};

// Company Action Menu Component
interface CompanyActionMenuProps {
  company: Company;
  onAction: (companyId: string, action: 'view' | 'edit' | 'delete') => void;
  compact?: boolean;
  isKanban?: boolean;
}

const CompanyActionMenu: React.FC<CompanyActionMenuProps> = ({ company, onAction, compact = false, isKanban = false }) => {
  const { colors, theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group/menu"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className={`${compact ? 'p-1' : 'p-2'} rounded-lg transition-all duration-200 hover:scale-110`}
        style={{ 
          backgroundColor: isHovered ? (theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)') : 'transparent',
          color: colors.text
        }}
        title="Company Actions"
        aria-label="Open company actions menu"
      >
        <FiMoreVertical className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
      </button>

      <AnimatePresence>
        {(showMenu || isHovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isKanban ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isKanban ? -10 : 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 ${isKanban ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 w-36 rounded-lg shadow-xl border overflow-hidden`}
            style={{ 
              backgroundColor: colors.card,
              borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
              boxShadow: theme === 'light' 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(company.id, 'view');
                setShowMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors"
              style={{ 
                color: colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEye className="w-3 h-3 mr-2" />
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(company.id, 'edit');
                setShowMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors"
              style={{ 
                color: colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEdit className="w-3 h-3 mr-2" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(company.id, 'delete');
                setShowMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors"
              style={{ 
                color: '#EF4444',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiTrash2 className="w-3 h-3 mr-2" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompaniesCard;
