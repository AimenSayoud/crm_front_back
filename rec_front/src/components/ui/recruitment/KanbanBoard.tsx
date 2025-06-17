// src/components/ui/recruitment/KanbanBoard.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

// Define the recruitment stages according to the document
export type RecruitmentStage = 'received' | 'interview_planned' | 'interview_completed' | 'client_waiting' | 'recruited';

// Map stage IDs to display names and short names for mobile
const stageConfig = {
  received: { 
    name: 'Applications', 
    shortName: 'Apps',
    color: '#3B82F6' // Blue
  },
  interview_planned: { 
    name: 'Interview Scheduled', 
    shortName: 'Schedule',
    color: '#8B5CF6' // Purple
  },
  interview_completed: { 
    name: 'Interview Completed', 
    shortName: 'Completed',
    color: '#F59E0B' // Amber
  },
  client_waiting: { 
    name: 'Client Review', 
    shortName: 'Review',
    color: '#10B981' // Emerald
  },
  recruited: { 
    name: 'Hired', 
    shortName: 'Hired',
    color: '#EC4899' // Pink
  }
};

// Define the candidate type for the Kanban board
export interface KanbanCandidate {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  stage: RecruitmentStage;
  company?: string;
  date?: string | Date;
  assignedTo?: string;
  tags?: string[];
  avatarUrl?: string;
}

interface KanbanBoardProps {
  candidates: KanbanCandidate[];
  onCandidateClick: (id: string) => void;
  onStageChange: (candidateId: string, newStage: RecruitmentStage) => void;
  loading: boolean;
  renderCard?: (candidate: KanbanCandidate, index: number, stage: RecruitmentStage) => React.ReactNode;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  onCandidateClick,
  onStageChange,
  loading,
  renderCard
}) => {
  const { colors, theme } = useTheme();
  
  // State to track which card is being dragged
  const [draggingCandidate, setDraggingCandidate] = useState<string | null>(null);
  // State to track which column is being hovered over
  const [hoveredColumn, setHoveredColumn] = useState<RecruitmentStage | null>(null);
  // State to track window width for responsive adjustments
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  // State to track if we're in a touch environment
  const [isTouch, setIsTouch] = useState<boolean>(false);
  
  // Reference to track drag start position
  const dragOriginRef = useRef<RecruitmentStage | null>(null);
  // Reference to track the container for horizontal scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Reference to store column elements and their positions for drag detection
  const columnRefs = useRef<Map<RecruitmentStage, DOMRect>>(new Map());
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updateColumnRects();
    };
    
    // Detect touch device
    const detectTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    window.addEventListener('resize', handleResize);
    detectTouch();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update column position data on window resize or after mounting
  const updateColumnRects = () => {
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      const stageElements = document.querySelectorAll('[data-stage-id]');
      const newRects = new Map<RecruitmentStage, DOMRect>();
      
      stageElements.forEach((element) => {
        const stageId = element.getAttribute('data-stage-id') as RecruitmentStage;
        const rect = element.getBoundingClientRect();
        newRects.set(stageId, rect);
      });
      
      columnRefs.current = newRects;
    }, 100);
  };
  
  // Update column rects when candidates change (columns might resize)
  useEffect(() => {
    updateColumnRects();
  }, [candidates]);
  
  // Auto-scroll container when dragging near edges
  useEffect(() => {
    if (!draggingCandidate || !scrollContainerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      // Get container bounds
      const rect = container.getBoundingClientRect();
      
      // Define scroll zones at left and right edges (15% of container width)
      const scrollZoneSize = rect.width * 0.15;
      
      // Calculate distance from edge
      const distanceFromLeft = e.clientX - rect.left;
      const distanceFromRight = rect.right - e.clientX;
      
      // Set scroll speed based on how close to edge (max 15px per frame)
      let scrollSpeed = 0;
      
      if (distanceFromLeft < scrollZoneSize) {
        scrollSpeed = -Math.max(15 * (1 - distanceFromLeft / scrollZoneSize), 3);
      } else if (distanceFromRight < scrollZoneSize) {
        scrollSpeed = Math.max(15 * (1 - distanceFromRight / scrollZoneSize), 3);
      }
      
      // Apply scroll
      if (scrollSpeed !== 0) {
        container.scrollLeft += scrollSpeed;
      }
      
      // Check which column the dragged element is over
      checkDragOverColumn(e.clientX, e.clientY);
    };
    
    // Special handler for touch events
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      
      const touch = e.touches[0];
      const container = scrollContainerRef.current;
      if (!container) return;
      
      // Check which column the touch is over
      checkDragOverColumn(touch.clientX, touch.clientY);
    };
    
    // Determine which column the drag is over based on position
    const checkDragOverColumn = (clientX: number, clientY: number) => {
      // Only process if we have column data
      if (columnRefs.current.size === 0) return;
      
      let newHoveredColumn: RecruitmentStage | null = null;
      let closestDistance = Infinity;
      
      // Find which column the pointer is over
      columnRefs.current.forEach((rect, stageId) => {
        // Check if point is inside column
        if (
          clientX >= rect.left && 
          clientX <= rect.right && 
          clientY >= rect.top && 
          clientY <= rect.bottom
        ) {
          newHoveredColumn = stageId;
          return; // Exit early if we're directly over a column
        }
        
        // If not directly over a column, find the closest one
        // Calculate distance to column center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(clientX - centerX, 2) + 
          Math.pow(clientY - centerY, 2)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          newHoveredColumn = stageId;
        }
      });
      
      // Only update if changed
      if (newHoveredColumn !== hoveredColumn) {
        setHoveredColumn(newHoveredColumn);
      }
    };
    
    if (isTouch) {
      document.addEventListener('touchmove', handleTouchMove);
      return () => document.removeEventListener('touchmove', handleTouchMove);
    } else {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [draggingCandidate, hoveredColumn, isTouch]);
  
  // List of all stages in order
  const stages: RecruitmentStage[] = ['received', 'interview_planned', 'interview_completed', 'client_waiting', 'recruited'];
  
  // Get candidates for a specific stage
  const getCandidatesByStage = (stage: RecruitmentStage) => {
    return candidates.filter(c => c.stage === stage);
  };
  
  // Handle drag start event
  const handleDragStart = (candidateId: string, stage: RecruitmentStage) => {
    setDraggingCandidate(candidateId);
    dragOriginRef.current = stage;
    
    // Make sure column positions are updated
    updateColumnRects();
  };
  
  // Handle drag end event
  const handleDragEnd = (candidateId: string) => {
    const originStage = dragOriginRef.current;
    const targetStage = hoveredColumn;
    
    // Only trigger stage change if dropping into a different column
    if (originStage && targetStage && originStage !== targetStage) {
      // Animate the transition
      onStageChange(candidateId, targetStage);
    }
    
    // Reset states
    setDraggingCandidate(null);
    setHoveredColumn(null);
    dragOriginRef.current = null;
  };
  
  // Function to determine if a card is draggable
  // You might want to add business rules later (e.g., cards in 'recruited' stage can't be moved)
  const isCardDraggable = () => {
    return true; // All cards draggable for now
  };
  
  // Function to get tag color based on tag name for visual variety
  const getTagColor = (tag: string) => {
    // Simple hash function to generate a number from string
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate a hue value between 0-360 for HSL color
    const hue = hash % 360;
    
    // Return colors appropriate for light/dark theme
    return {
      bg: theme === 'light' 
        ? `hsla(${hue}, 85%, 93%, 0.8)` 
        : `hsla(${hue}, 70%, 20%, 0.8)`,
      text: theme === 'light' 
        ? `hsl(${hue}, 75%, 35%)` 
        : `hsl(${hue}, 80%, 75%)`
    };
  };
  
  // Generate avatar color from user name
  const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 65%, ${theme === 'light' ? '45%' : '65%'})`;
  };
  
  // Format date to a readable string
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Format differently based on screen size
    return windowWidth <= 768 
      ? d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      : d.toLocaleDateString();
  };
  
  // Custom card component with Framer Motion
  const KanbanCard = ({ candidate, stageId }: { candidate: KanbanCandidate, stageId: RecruitmentStage }) => {
    const isDraggable = isCardDraggable();
    const isBeingDragged = draggingCandidate === candidate.id;
    const isSmallScreen = windowWidth <= 768;
    
    // Track position for drag detection
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Create a spring for the card scale during drag
    const scale = useTransform(
      [x, y],
      ([latestX, latestY]) => {
        const moveDistance = Math.sqrt(Math.pow(Number(latestX), 2) + Math.pow(Number(latestY), 2));
        // Scale up slightly as card moves further from origin
        return 1 + Math.min(0.05, moveDistance / 500);
      }
    );
    
    return (
      <motion.div
        layout
        layoutId={`card-${candidate.id}`}
        drag={isDraggable}
        dragSnapToOrigin={!hoveredColumn || hoveredColumn === stageId}
        dragElastic={isTouch ? 0.05 : 0.1} // Less elasticity on touch devices
        dragMomentum={false}
        dragTransition={{
          bounceStiffness: 500,
          bounceDamping: 40
        }}
        onDragStart={() => handleDragStart(candidate.id, stageId)}
        onDragEnd={() => handleDragEnd(candidate.id)}
        onClick={() => !isBeingDragged && onCandidateClick(candidate.id)}
        whileHover={{ scale: isDraggable ? 1.01 : 1, boxShadow: '0 3px 6px rgba(0,0,0,0.1)' }}
        whileDrag={{ 
          boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          cursor: 'grabbing',
          zIndex: 999
        }}
        style={{ 
          x, y, scale,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderLeft: `3px solid ${stageConfig[stageId].color}`,
          borderRadius: '0.375rem',
          padding: isSmallScreen ? '0.5rem' : '0.75rem',
          backgroundColor: theme === 'light' ? 'white' : '#1F2937',
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 25 }
        }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className={`mb-2 cursor-grab active:cursor-grabbing ${isDraggable ? '' : 'cursor-pointer'}`}
      >
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center">
            {candidate.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={candidate.avatarUrl} 
                alt={`${candidate.firstName} ${candidate.lastName}`}
                className="w-6 h-6 rounded-full mr-1.5 object-cover"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium mr-1.5"
                style={{ background: `linear-gradient(135deg, ${getAvatarColor(candidate.firstName)}, ${getAvatarColor(candidate.lastName)})` }}
              >
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>
            )}
            <div>
              <h4 className="font-medium text-xs" style={{ color: colors.text }}>
                {/* Truncate long names on small screens */}
                {isSmallScreen 
                  ? `${candidate.firstName.charAt(0)}. ${candidate.lastName}`
                  : `${candidate.firstName} ${candidate.lastName}`}
              </h4>
              <p className="text-[10px] truncate max-w-[100px]" style={{ color: `${colors.text}99` }}>
                {candidate.position}
              </p>
            </div>
          </div>
          
          {candidate.company && !isSmallScreen && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[60px]"
              style={{ 
                backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                color: colors.text 
              }}
            >
              {candidate.company}
            </span>
          )}
        </div>
        
        {/* Tags section - show fewer tags on small screens */}
        {candidate.tags && candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 my-1">
            {candidate.tags.slice(0, isSmallScreen ? 2 : 3).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="text-[9px] px-1.5 py-0.25 rounded-full truncate max-w-[80px]"
                style={{ 
                  backgroundColor: getTagColor(tag).bg,
                  color: getTagColor(tag).text
                }}
              >
                {tag}
              </span>
            ))}
            {candidate.tags.length > (isSmallScreen ? 2 : 3) && (
              <span
                className="text-[9px] px-1 py-0.25 rounded-full"
                style={{ 
                  backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                  color: `${colors.text}80` 
                }}
              >
                +{candidate.tags.length - (isSmallScreen ? 2 : 3)}
              </span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-1 text-[9px]" style={{ color: `${colors.text}70` }}>
          {formatDate(candidate.date) && (
            <span>
              {formatDate(candidate.date)}
            </span>
          )}
          
          {candidate.assignedTo && (
            <div className="flex items-center">
              <div 
                className="w-3.5 h-3.5 rounded-full mr-0.5 flex items-center justify-center text-white text-[8px]"
                style={{ backgroundColor: getAvatarColor(candidate.assignedTo) }}
              >
                {candidate.assignedTo[0].toUpperCase()}
              </div>
              <span className="truncate max-w-[50px]">
                {isSmallScreen 
                  ? candidate.assignedTo.split(' ')[0]
                  : candidate.assignedTo}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };
  
  // Column component for each stage
  const KanbanColumn = ({ stage }: { stage: RecruitmentStage }) => {
    const stageColor = stageConfig[stage].color;
    const stageCandidates = getCandidatesByStage(stage);
    const isColumnHovered = hoveredColumn === stage;
    const isSmallScreen = windowWidth <= 768;
    
    // Calculate max height based on screen size
    const maxColumnHeight = isSmallScreen 
      ? 'calc(100vh - 200px)'  // Less height on mobile
      : 'calc(100vh - 220px)'; // More height on desktop
    
    return (
      <motion.div 
        data-stage-id={stage}
        className="kanban-column h-full flex flex-col"
        animate={{
          backgroundColor: isColumnHovered 
            ? theme === 'light' ? 'rgba(243, 244, 246, 0.9)' : 'rgba(31, 41, 55, 0.9)'
            : theme === 'light' ? 'rgba(243, 244, 246, 0.5)' : 'rgba(31, 41, 55, 0.5)'
        }}
        transition={{ duration: 0.2 }}
        style={{ 
          borderRadius: '0.375rem',
          padding: isSmallScreen ? '0.5rem' : '0.75rem',
          minWidth: isSmallScreen ? '180px' : '220px',
          maxWidth: isSmallScreen ? '220px' : '280px',
          width: '100%',
          border: isColumnHovered 
            ? `1px solid ${stageColor}50` 
            : '1px solid transparent',
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div
              className="w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: stageColor }}
            />
            <h3 
              className="text-xs font-medium truncate"
              style={{ color: colors.text }}
            >
              {isSmallScreen 
                ? stageConfig[stage].shortName 
                : stageConfig[stage].name}
            </h3>
          </div>
          <span 
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${stageColor}15`,
              color: stageColor 
            }}
          >
            {stageCandidates.length}
          </span>
        </div>
        
        {/* Drop zone indicator for when dragging over column */}
        {isColumnHovered && draggingCandidate && (
          <motion.div
            className="rounded-md mb-2 border-2 border-dashed"
            style={{ 
              height: "45px", 
              backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(31, 41, 55, 0.7)',
              borderColor: `${stageColor}70` 
            }}
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.5 }}
            transition={{ duration: 0.2 }}
            layoutId="drop-zone-indicator"
          >
            <div className="h-full flex items-center justify-center text-[10px]" style={{ color: stageColor }}>
              Drop here
            </div>
          </motion.div>
        )}
        
        {/* Scrollable cards container */}
        <div 
          className="space-y-1.5 overflow-y-auto custom-scrollbar flex-grow relative" 
          style={{ maxHeight: maxColumnHeight }}
        >
          <AnimatePresence>
            {stageCandidates.map((candidate) => (
              renderCard ? 
                renderCard(candidate, 0, stage) : 
                <KanbanCard 
                  key={candidate.id} 
                  candidate={candidate}
                  stageId={stage}
                />
            ))}
            
            {/* Empty state */}
            {stageCandidates.length === 0 && !isColumnHovered && (
              <motion.div 
                className="border-2 border-dashed rounded-md p-2 text-center flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  borderColor: `${stageColor}30`,
                  color: `${colors.text}50`,
                  height: isSmallScreen ? '80px' : '100px',
                }}
              >
                <p className="text-[10px] mb-0.5">No candidates</p>
                <p className="text-[8px]">Drag here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <motion.div 
          className="w-10 h-10 rounded-full border-3 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ borderColor: `${colors.primary}40`, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Render indicator showing where the dragged card will go
  const renderMoveIndicator = () => {
    if (!draggingCandidate || !hoveredColumn || !dragOriginRef.current) return null;
    
    const originStage = dragOriginRef.current;
    const destinationStage = hoveredColumn;
    
    // Don't show indicator if dragging within same column
    if (originStage === destinationStage) return null;
    
    // Find position in stages array
    const originIndex = stages.indexOf(originStage);
    const destIndex = stages.indexOf(destinationStage);
    const direction = destIndex > originIndex ? 'right' : 'left';
    
    // Generate skipped column names
    const skippedColumns: string[] = [];
    if (Math.abs(destIndex - originIndex) > 1) {
      const start = Math.min(originIndex, destIndex) + 1;
      const end = Math.max(originIndex, destIndex);
      
      for (let i = start; i < end; i++) {
        skippedColumns.push(stageConfig[stages[i]].shortName);
      }
    }
    
    return (
      <motion.div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-full shadow-lg z-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{ 
          backgroundColor: theme === 'light' ? 'white' : '#111827',
          border: `1px solid ${colors.border}`,
          maxWidth: '90vw'
        }}
      >
        <div className="flex items-center text-xs space-x-1">
          <div className="flex items-center" style={{ color: stageConfig[originStage].color }}>
            <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: stageConfig[originStage].color }} />
            <span>{stageConfig[originStage].shortName}</span>
          </div>
          
          <span className="px-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'right' ? "M5 12h14M12 5l7 7-7 7" : "M19 12H5M12 19l-7-7 7-7"} />
            </svg>
          </span>
          
          {skippedColumns.length > 0 && (
            <div className="text-[10px] text-gray-400 px-1 truncate max-w-[80px]">
              via {skippedColumns.join(', ')}
            </div>
          )}
          
          <div className="flex items-center" style={{ color: stageConfig[destinationStage].color }}>
            <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: stageConfig[destinationStage].color }} />
            <span>{stageConfig[destinationStage].shortName}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <motion.div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto py-2 px-1 pb-6 custom-scrollbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(155, 155, 155, 0.3) transparent',
        }}
      >
        {stages.map(stage => (
          <KanbanColumn key={stage} stage={stage} />
        ))}
      </motion.div>
      
      {/* Mobile hint for horizontal scrolling - only show on small screens */}
      {windowWidth <= 768 && !draggingCandidate && (
        <div className="w-full flex justify-center mt-1 mb-4">
          <motion.div 
            className="text-[10px] flex items-center px-2 py-1 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            style={{ 
              backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              color: `${colors.text}80`
            }}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Swipe to view all columns
          </motion.div>
        </div>
      )}
      
      {/* Animate the destination indicator */}
      <AnimatePresence>
        {draggingCandidate && hoveredColumn && renderMoveIndicator()}
      </AnimatePresence>
      
      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(155, 155, 155, 0.3) transparent;
        }
        
        /* Touch scrolling improvements */
        @media (pointer: coarse) {
          .custom-scrollbar {
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
            scroll-padding: 0.75rem;
          }
          
          .kanban-column {
            scroll-snap-align: start;
          }
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;