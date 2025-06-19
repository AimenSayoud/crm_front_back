'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiUser, 
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiTrash2,
  FiStar
} from 'react-icons/fi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type ViewMode = 'list' | 'cards' | 'kanban';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  experience: string;
  skills: string[];
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
  avatar?: string;
  salary?: string;
  rating?: number;
}

interface CandidatesCardProps {
  candidates: Candidate[];
  viewMode: ViewMode;
  onCandidateUpdate: (candidateId: string, newStatus: string) => void;
  onCandidateAction: (candidateId: string, action: 'view' | 'edit' | 'delete') => void;
}

// Status columns configuration
const statusColumns = [
  { id: 'Applied', title: 'Applied', color: '#6B7280' },
  { id: 'Screening', title: 'Screening', color: '#F59E0B' },
  { id: 'Interview', title: 'Interview', color: '#3B82F6' },
  { id: 'Offer', title: 'Offer', color: '#8B5CF6' },
  { id: 'Hired', title: 'Hired', color: '#10B981' },
  { id: 'Rejected', title: 'Rejected', color: '#EF4444' },
];

// Droppable column component
const DroppableColumn: React.FC<{
  id: string;
  title: string;
  color: string;
  candidates: Candidate[];
  onCandidateAction: (candidateId: string, action: 'view' | 'edit' | 'delete') => void;
}> = ({ id, title, color, candidates, onCandidateAction }) => {
  const { colors, theme } = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column Header - Compact */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-xs" style={{ color: colors.text }}>
            {title}
          </h3>
          <span
            className="px-1.5 py-0.5 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {candidates.length}
          </span>
        </div>
        <div
          className="h-0.5 rounded-full"
          style={{ backgroundColor: `${color}30` }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: color,
              width: `${Math.min(100, candidates.length * 20)}%`,
            }}
          />
        </div>
      </div>

      {/* Droppable Area - Compact */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-all duration-200 ${
          isOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-600'
        }`}
        style={{
          backgroundColor: isOver
            ? theme === 'light'
              ? '#EFF6FF'
              : '#1E3A8A20'
            : 'transparent',
        }}
      >
        <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <SortableCandidateCard
                key={candidate.id}
                candidate={candidate}
                onCandidateAction={onCandidateAction}
              />
            ))}
            
            {/* Empty State - Compact */}
            {candidates.length === 0 && (
              <div
                className="p-4 text-center rounded-lg border-2 border-dashed"
                style={{
                  borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
                  color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                }}
              >
                <FiUser className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No candidates</p>
                <p className="text-xs mt-0.5 opacity-75">Drop here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

// Sortable candidate card component
const SortableCandidateCard: React.FC<{
  candidate: Candidate;
  onCandidateAction: (candidateId: string, action: 'view' | 'edit' | 'delete') => void;
}> = ({ candidate, onCandidateAction }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CandidateCardContent 
        candidate={candidate} 
        onCandidateAction={onCandidateAction}
        isDragging={isDragging}
      />
    </div>
  );
};

// Card view component - optimized for grid layout
const CandidateCardsContent: React.FC<{
  candidate: Candidate;
  onCandidateAction: (candidateId: string, action: 'view' | 'edit' | 'delete') => void;
}> = ({ candidate, onCandidateAction }) => {
  const { colors, theme } = useTheme();

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColumn = statusColumns.find(col => col.id === status);
    return statusColumn?.color || colors.primary;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer group h-80 flex flex-col"
      style={{
        backgroundColor: colors.card,
        borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
      }}
    >
      {/* Header with Avatar and Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
            }}
          >
            {candidate.avatar ? (
              <img src={candidate.avatar} alt={candidate.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              getInitials(candidate.name)
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" style={{ color: colors.text }}>
              {candidate.name}
            </h3>
            <p className="text-sm truncate" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              {candidate.position}
            </p>
            {candidate.rating && (
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-3 h-3 ${i < candidate.rating! ? 'fill-current' : ''}`}
                    style={{ color: i < candidate.rating! ? '#F59E0B' : '#D1D5DB' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative group/menu flex-shrink-0">
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="More actions"
            onClick={(e) => e.stopPropagation()}
          >
            <FiMoreVertical className="w-4 h-4" style={{ color: colors.text }} />
          </button>
          
          {/* Dropdown Menu */}
          <div 
            className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg border opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-20"
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.border
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'view');
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors rounded-t-lg"
              style={{ 
                color: colors.text,
                ':hover': {
                  backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEye className="w-4 h-4 mr-2" />
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'edit');
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors"
              style={{ 
                color: colors.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'delete');
              }}
              className="w-full flex items-center px-3 py-2 text-sm transition-colors rounded-b-lg"
              style={{ 
                color: theme === 'light' ? '#DC2626' : '#F87171'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(248, 113, 113, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${getStatusColor(candidate.status)}20`,
            color: getStatusColor(candidate.status),
          }}
        >
          <div
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: getStatusColor(candidate.status) }}
          />
          {candidate.status}
        </span>
      </div>

      {/* Content Area - Flexible */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
            <FiMail className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
          <div className="flex items-center text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
            <FiMapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{candidate.location}</span>
          </div>
        </div>

        {/* Experience & Salary */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
            <FiUser className="w-4 h-4 mr-2" />
            <span>{candidate.experience}</span>
          </div>
          {candidate.salary && (
            <span className="font-semibold" style={{ color: colors.primary }}>
              {candidate.salary}
            </span>
          )}
        </div>

        {/* Skills */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs font-medium rounded-md"
                style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: colors.text,
                }}
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span
                className="px-2 py-1 text-xs font-medium rounded-md"
                style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: colors.text,
                }}
              >
                +{candidate.skills.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Applied Date - Always at bottom */}
        <div className="flex items-center text-sm mt-auto" style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
          <FiCalendar className="w-4 h-4 mr-2" />
          <span>Applied {candidate.appliedDate}</span>
        </div>
      </div>
    </div>
  );
};

// Candidate card content component
const CandidateCardContent: React.FC<{
  candidate: Candidate;
  onCandidateAction: (candidateId: string, action: 'view' | 'edit' | 'delete') => void;
  isDragging?: boolean;
}> = ({ candidate, onCandidateAction, isDragging = false }) => {
  const { colors, theme } = useTheme();

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColumn = statusColumns.find(col => col.id === status);
    return statusColumn?.color || colors.primary;
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg border p-3 transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-xl rotate-3 scale-105' : ''
      }`}
      style={{
        backgroundColor: colors.card,
        borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
      }}
      whileHover={!isDragging ? { y: -2 } : {}}
      layout
    >
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Avatar - Smaller */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
            }}
          >
            {candidate.avatar ? (
              <img src={candidate.avatar} alt={candidate.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              getInitials(candidate.name)
            )}
          </div>

          {/* Basic Info - Compact */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs truncate" style={{ color: colors.text }}>
              {candidate.name}
            </h3>
            <p className="text-xs truncate opacity-75" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              {candidate.position}
            </p>
          </div>
        </div>

        {/* Actions Menu - Smaller */}
        <div className="relative group flex-shrink-0">
          <button 
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="More actions"
            onClick={(e) => e.stopPropagation()}
          >
            <FiMoreVertical className="w-3 h-3" style={{ color: colors.text }} />
          </button>
          
          {/* Dropdown Menu - Compact */}
          <div 
            className="absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20"
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.border
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'view');
              }}
              className="w-full flex items-center px-2 py-1.5 text-xs transition-colors rounded-t-md"
              style={{ color: colors.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEye className="w-3 h-3 mr-1.5" />
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'edit');
              }}
              className="w-full flex items-center px-2 py-1.5 text-xs transition-colors"
              style={{ color: colors.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiEdit className="w-3 h-3 mr-1.5" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCandidateAction(candidate.id, 'delete');
              }}
              className="w-full flex items-center px-2 py-1.5 text-xs transition-colors rounded-b-md"
              style={{ 
                color: theme === 'light' ? '#DC2626' : '#F87171'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(248, 113, 113, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiTrash2 className="w-3 h-3 mr-1.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Essential Info Only */}
      <div className="space-y-1.5">
        {/* Location - Compact */}
        <div className="flex items-center text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
          <FiMapPin className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{candidate.location}</span>
        </div>

        {/* Experience & Salary - Inline */}
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
            {candidate.experience}
          </span>
          {candidate.salary && (
            <span className="font-semibold" style={{ color: colors.primary }}>
              {candidate.salary}
            </span>
          )}
        </div>

        {/* Top Skills Only - Max 2 */}
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="px-1.5 py-0.5 text-xs font-medium rounded-sm"
              style={{
                backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                color: colors.text,
              }}
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 2 && (
            <span
              className="px-1.5 py-0.5 text-xs font-medium rounded-sm opacity-75"
              style={{
                backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                color: colors.text,
              }}
            >
              +{candidate.skills.length - 2}
            </span>
          )}
        </div>

        {/* Applied Date - Minimal */}
        <div className="flex items-center text-xs opacity-60" style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
          <FiCalendar className="w-2.5 h-2.5 mr-1" />
          <span>{candidate.appliedDate}</span>
        </div>
      </div>
    </motion.div>
  );
};

const CandidatesCard: React.FC<CandidatesCardProps> = ({
  candidates,
  viewMode,
  onCandidateUpdate,
  onCandidateAction,
}) => {
  const { colors, theme } = useTheme();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Group candidates by status for kanban view
  const candidatesByStatus = statusColumns.reduce((acc, status) => {
    acc[status.id] = candidates.filter(candidate => candidate.status === status.id);
    return acc;
  }, {} as Record<string, Candidate[]>);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find the candidate being dragged
      const draggedCandidate = candidates.find(c => c.id === active.id);
      if (draggedCandidate) {
        // Check if we're dropping on a column or another candidate
        const newStatus = statusColumns.find(col => col.id === over.id)?.id || 
                         candidates.find(c => c.id === over.id)?.status;
        
        if (newStatus && newStatus !== draggedCandidate.status) {
          onCandidateUpdate(active.id as string, newStatus);
        }
      }
    }

    setActiveId(null);
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {candidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CandidateCardContent candidate={candidate} onCandidateAction={onCandidateAction} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <CandidateCardsContent candidate={candidate} onCandidateAction={onCandidateAction} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Kanban View
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[450px]">
        {statusColumns.map((column) => (
          <DroppableColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            candidates={candidatesByStatus[column.id] || []}
            onCandidateAction={onCandidateAction}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <div style={{ transform: 'rotate(5deg)' }}>
            <CandidateCardContent
              candidate={candidates.find(c => c.id === activeId)!}
              onCandidateAction={onCandidateAction}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CandidatesCard; 