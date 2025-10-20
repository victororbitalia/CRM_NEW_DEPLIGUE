import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface CalendarReservation {
  id: string;
  customerId: string;
  customerName: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string;
  tableName?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  tables: Array<{
    id: string;
    number: string;
    capacity: number;
    area: string;
  }>;
  reservations: CalendarReservation[];
}

export interface CalendarDay {
  date: Date;
  reservations: CalendarReservation[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    seated: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

export interface AvailabilityResult {
  available: boolean;
  date: string;
  partySize: number;
  duration: number;
  operatingHours: {
    open: string;
    close: string;
  };
  timeSlots: TimeSlot[];
}

interface UseReservationCalendarOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useReservationCalendar = (options: UseReservationCalendarOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 60000 } = options;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Fetch reservations for a date range
  const fetchReservations = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/reservations?${params}`);
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const processedReservations = data.data.map((reservation: any) => ({
          ...reservation,
          date: new Date(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
        }));
        
        setReservations(processedReservations);
      } else {
        setError(data.error || 'Failed to fetch reservations');
        showError(data.error || 'Failed to fetch reservations');
      }
    } catch (err) {
      const errorMessage = 'Connection error while fetching reservations';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Check availability for a specific date and party size
  const checkAvailability = useCallback(async (
    date: Date, 
    partySize: number, 
    duration?: number
  ): Promise<AvailabilityResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/reservations/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          partySize,
          duration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        setError(data.error || 'Failed to check availability');
        showError(data.error || 'Failed to check availability');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while checking availability';
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Navigate to previous period
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  // Navigate to next period
  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  // Navigate to today
  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Get date range for current view
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        // Single day
        break;
      case 'week':
        // Start of week (Sunday)
        start.setDate(currentDate.getDate() - currentDate.getDay());
        // End of week (Saturday)
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        // Start of month
        start.setDate(1);
        // End of month
        end.setMonth(end.getMonth() + 1, 0);
        break;
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  // Get calendar days for month view
  const getCalendarDays = useCallback((): CalendarDay[] => {
    const { start, end } = getDateRange();
    const days: CalendarDay[] = [];
    
    // For month view, include days from previous and next months to fill the grid
    if (viewMode === 'month') {
      const startOfMonth = new Date(start);
      startOfMonth.setDate(1);
      
      const endOfMonth = new Date(end);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      
      // Start from the Sunday of the first day of the month
      const calendarStart = new Date(startOfMonth);
      calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
      
      // Generate 42 days (6 weeks) to cover the entire month
      for (let i = 0; i < 42; i++) {
        const date = new Date(calendarStart);
        date.setDate(calendarStart.getDate() + i);
        
        // Get reservations for this day
        const dayReservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.date);
          return reservationDate.toDateString() === date.toDateString();
        });
        
        // Calculate stats
        const stats = {
          total: dayReservations.length,
          pending: dayReservations.filter(r => r.status === 'pending').length,
          confirmed: dayReservations.filter(r => r.status === 'confirmed').length,
          seated: dayReservations.filter(r => r.status === 'seated').length,
          completed: dayReservations.filter(r => r.status === 'completed').length,
          cancelled: dayReservations.filter(r => r.status === 'cancelled').length,
          noShow: dayReservations.filter(r => r.status === 'no_show').length,
        };
        
        days.push({
          date,
          reservations: dayReservations,
          stats,
        });
      }
    } else {
      // For day and week view, just get the days in the range
      const current = new Date(start);
      while (current <= end) {
        const date = new Date(current);
        
        // Get reservations for this day
        const dayReservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.date);
          return reservationDate.toDateString() === date.toDateString();
        });
        
        // Calculate stats
        const stats = {
          total: dayReservations.length,
          pending: dayReservations.filter(r => r.status === 'pending').length,
          confirmed: dayReservations.filter(r => r.status === 'confirmed').length,
          seated: dayReservations.filter(r => r.status === 'seated').length,
          completed: dayReservations.filter(r => r.status === 'completed').length,
          cancelled: dayReservations.filter(r => r.status === 'cancelled').length,
          noShow: dayReservations.filter(r => r.status === 'no_show').length,
        };
        
        days.push({
          date,
          reservations: dayReservations,
          stats,
        });
        
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  }, [getDateRange, reservations, viewMode]);

  // Get time slots for a specific day
  const getTimeSlots = useCallback((date: Date): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];
    
    // Generate time slots from 12:00 to 23:00 with 30-minute intervals
    for (let hour = 12; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Get reservations for this time slot
        const slotReservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.date);
          const isSameDate = reservationDate.toDateString() === date.toDateString();
          
          if (!isSameDate) return false;
          
          // Check if the reservation overlaps with this time slot
          const [resHour, resMinute] = reservation.startTime.split(':').map(Number);
          const [endHour, endMinute] = reservation.endTime.split(':').map(Number);
          
          const slotMinutes = hour * 60 + minute;
          const resStartMinutes = resHour * 60 + resMinute;
          const resEndMinutes = endHour * 60 + endMinute;
          
          return slotMinutes >= resStartMinutes && slotMinutes < resEndMinutes;
        });
        
        // Determine if tables are available (mock implementation)
        const available = slotReservations.length < 10; // Assume we have 10 tables
        
        timeSlots.push({
          time,
          available,
          tables: [], // This would be populated based on actual table availability
          reservations: slotReservations,
        });
      }
    }
    
    return timeSlots;
  }, [reservations]);

  // Get reservations for a specific date
  const getReservationsForDate = useCallback((date: Date): CalendarReservation[] => {
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate.toDateString() === date.toDateString();
    });
  }, [reservations]);

  // Get reservation statistics for the current view
  const getViewStats = useCallback(() => {
    const { start, end } = getDateRange();
    
    const viewReservations = reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate >= start && reservationDate <= end;
    });
    
    const stats = {
      total: viewReservations.length,
      pending: viewReservations.filter(r => r.status === 'pending').length,
      confirmed: viewReservations.filter(r => r.status === 'confirmed').length,
      seated: viewReservations.filter(r => r.status === 'seated').length,
      completed: viewReservations.filter(r => r.status === 'completed').length,
      cancelled: viewReservations.filter(r => r.status === 'cancelled').length,
      noShow: viewReservations.filter(r => r.status === 'no_show').length,
    };
    
    return stats;
  }, [getDateRange, reservations]);

  // Update view mode
  const updateViewMode = useCallback((newViewMode: 'day' | 'week' | 'month') => {
    setViewMode(newViewMode);
  }, []);

  // Update current date
  const updateCurrentDate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Load data when date or view mode changes
  useEffect(() => {
    const { start, end } = getDateRange();
    fetchReservations(start, end);
  }, [getDateRange, fetchReservations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const { start, end } = getDateRange();
      fetchReservations(start, end);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, getDateRange, fetchReservations]);

  return {
    // State
    currentDate,
    viewMode,
    reservations,
    isLoading,
    error,
    
    // Navigation
    navigatePrevious,
    navigateNext,
    navigateToday,
    
    // Data accessors
    getDateRange,
    getCalendarDays,
    getTimeSlots,
    getReservationsForDate,
    getViewStats,
    
    // Actions
    checkAvailability,
    updateViewMode,
    updateCurrentDate,
    
    // Utility
    refetch: () => {
      const { start, end } = getDateRange();
      fetchReservations(start, end);
    },
  };
};

export default useReservationCalendar;