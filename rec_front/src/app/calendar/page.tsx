// src/app/calendar/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
// import { api } from '@/lib/api';
// import { useApiQuery } from '@/hooks/useApiQuery';
// import { Candidate } from '@/types';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  candidateId?: string;
  companyId?: string;
  description?: string;
  type: 'interview' | 'followup' | 'meeting' | 'other';
}

interface CalendarCell {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarPage = () => {
  const { colors } = useTheme();
  const user = useAuthStore(selectUser);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [calendar, setCalendar] = useState<CalendarCell[][]>([]);
  
  // Mock events (in a real app, these would come from an API)
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Interview with John Smith',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 10, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 11, 0),
      color: '#3B82F6', // blue
      candidateId: 'cand-1',
      type: 'interview',
    },
    {
      id: '2',
      title: 'Tech assessment with Sarah Lee',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 14, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 15, 30),
      color: '#10B981', // green
      candidateId: 'cand-2',
      type: 'interview',
    },
    {
      id: '3',
      title: 'Client meeting with TechCorp',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 9, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 10, 0),
      color: '#8B5CF6', // purple
      companyId: 'comp-1',
      type: 'meeting',
    },
    {
      id: '4',
      title: 'Follow-up call with Mark Johnson',
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 13, 0),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 13, 30),
      color: '#F59E0B', // amber
      candidateId: 'cand-3',
      type: 'followup',
    },
  ]);

  // Generate calendar grid based on current date and view mode
  const generateCalendar = React.useCallback(() => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week of the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Adjust for Sunday
    
    // Calculate how many rows we need
    const daysInMonth = lastDay.getDate();
    const weeksInMonth = Math.ceil((daysInMonth + firstDayOfWeek - 1) / 7);
    
    // Create calendar grid
    const grid: CalendarCell[][] = [];
    
    // Create weeks
    for (let week = 0; week < weeksInMonth; week++) {
      const weekRow: CalendarCell[] = [];
      
      // Create days in each week
      for (let day = 0; day < 7; day++) {
        const dayNumber = week * 7 + day - firstDayOfWeek + 2;
        const date = new Date(year, month, dayNumber);
        
        // Filter events for this day
        const dayEvents = events.filter(event => {
          return event.start.getDate() === date.getDate() &&
                 event.start.getMonth() === date.getMonth() &&
                 event.start.getFullYear() === date.getFullYear();
        });
        
        weekRow.push({
          date,
          events: dayEvents,
          isCurrentMonth: date.getMonth() === month,
          isToday: date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear(),
        });
      }
      
      grid.push(weekRow);
    }
    
    setCalendar(grid);
  }, [currentDate, events]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, viewMode, events, generateCalendar]);

  // Handle navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Handle event drag start
  const handleEventDragStart = (event: Event) => {
    setDraggedEvent(event);
  };

  // Handle event drop on a date
  const handleDateDrop = (date: Date) => {
    if (!draggedEvent) return;
    
    // Calculate the difference in days
    const diffDays = Math.floor((date.getTime() - draggedEvent.start.getTime()) / (24 * 60 * 60 * 1000));
    
    // Create new start and end dates with the time preserved
    const newStart = new Date(draggedEvent.start);
    newStart.setDate(newStart.getDate() + diffDays);
    
    const newEnd = new Date(draggedEvent.end);
    newEnd.setDate(newEnd.getDate() + diffDays);
    
    // Update the event
    const updatedEvents = events.map(event => {
      if (event.id === draggedEvent.id) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return event;
    });
    
    setEvents(updatedEvents);
    setDraggedEvent(null);
  };

  // Format a date as a display string
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Calendar
        </h1>
        <Button 
          variant="primary"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Add Event
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              style={{ color: colors.text }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              {formatDateDisplay(currentDate)}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              style={{ color: colors.text }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm rounded-md"
              style={{ 
                backgroundColor: `${colors.primary}20`, 
                color: colors.primary 
              }}
            >
              Today
            </button>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <div className="border rounded-md flex" style={{ borderColor: colors.border }}>
              <button
                className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setViewMode('month')}
                style={{ color: colors.text }}
              >
                Month
              </button>
              <button
                className={`px-3 py-2 text-sm ${viewMode === 'week' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setViewMode('week')}
                style={{ color: colors.text }}
              >
                Week
              </button>
              <button
                className={`px-3 py-2 text-sm ${viewMode === 'day' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                onClick={() => setViewMode('day')}
                style={{ color: colors.text }}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card noPadding>
        {/* Calendar days of week header */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: colors.border }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div 
              key={day} 
              className="px-2 py-3 text-center text-sm font-medium"
              style={{ color: `${colors.text}99` }}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div>
          {calendar.map((week, weekIndex) => (
            <div 
              key={`week-${weekIndex}`} 
              className="grid grid-cols-7 border-b last:border-b-0" 
              style={{ borderColor: colors.border }}
            >
              {week.map((day, dayIndex) => (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`relative h-32 p-1 border-r last:border-r-0 ${
                    !day.isCurrentMonth ? 'opacity-40' : ''
                  }`}
                  style={{ borderColor: colors.border }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDateDrop(day.date)}
                >
                  <div 
                    className={`text-right p-1 ${
                      day.isToday ? 'rounded-full w-7 h-7 flex items-center justify-center ml-auto' : ''
                    }`}
                    style={{ 
                      backgroundColor: day.isToday ? colors.primary : 'transparent',
                      color: day.isToday ? 'white' : colors.text
                    }}
                  >
                    {day.date.getDate()}
                  </div>
                  
                  <div className="mt-1 max-h-24 overflow-y-auto">
                    {day.events.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 mb-1 rounded cursor-pointer truncate"
                        style={{ backgroundColor: event.color, color: 'white' }}
                        onClick={() => setSelectedEvent(event)}
                        draggable
                        onDragStart={() => handleEventDragStart(event)}
                      >
                        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: colors.card }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Event Details
              </h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: `${colors.text}99` }}>
                  Title
                </label>
                <div style={{ color: colors.text }}>{selectedEvent.title}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: `${colors.text}99` }}>
                  Date & Time
                </label>
                <div style={{ color: colors.text }}>
                  {selectedEvent.start.toLocaleDateString()} {selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: `${colors.text}99` }}>
                  Type
                </label>
                <div style={{ color: colors.text }}>
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: `${colors.text}99` }}>
                    Description
                  </label>
                  <div style={{ color: colors.text }}>{selectedEvent.description}</div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                <Button variant="primary">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;