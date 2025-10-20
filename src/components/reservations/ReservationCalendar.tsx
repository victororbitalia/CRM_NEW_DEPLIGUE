'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';

interface Reservation {
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

interface ReservationCalendarProps {
  reservations: Reservation[];
  onReservationClick?: (reservation: Reservation) => void;
  onDateChange?: (date: Date) => void;
  selectedDate?: Date;
  isLoading?: boolean;
}

const statusColors = {
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  confirmed: 'bg-primary-100 text-primary-800 border-primary-200',
  seated: 'bg-success-100 text-success-800 border-success-200',
  completed: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  cancelled: 'bg-error-100 text-error-800 border-error-200',
  no_show: 'bg-error-100 text-error-800 border-error-200',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function ReservationCalendar({
  reservations,
  onReservationClick,
  onDateChange,
  selectedDate = new Date(),
  isLoading = false,
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const { showSuccess, showError } = useNotifications();

  // Time slots for the day view
  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  ];

  // Navigate to previous period
  const handlePrevious = () => {
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
    if (onDateChange) onDateChange(newDate);
  };

  // Navigate to next period
  const handleNext = () => {
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
    if (onDateChange) onDateChange(newDate);
  };

  // Go to today
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateChange) onDateChange(today);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Get reservations for a specific time slot
  const getReservationsForTimeSlot = (time: string) => {
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      const isSameDate = reservationDate.toDateString() === currentDate.toDateString();
      return isSameDate && reservation.startTime === time;
    });
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate.toDateString() === date.toDateString();
    });
  };

  // Render day view
  const renderDayView = () => {
    return (
      <div className="space-y-2">
        {timeSlots.map(time => {
          const slotReservations = getReservationsForTimeSlot(time);
          
          return (
            <div key={time} className="flex border-b border-secondary-200 pb-2">
              <div className="w-20 text-sm font-medium text-secondary-700 py-2">
                {time}
              </div>
              <div className="flex-1 space-y-1">
                {slotReservations.length === 0 ? (
                  <div className="text-sm text-secondary-500 italic py-2">
                    No reservations
                  </div>
                ) : (
                  slotReservations.map(reservation => (
                    <div
                      key={reservation.id}
                      className={`p-2 rounded-md border cursor-pointer transition-colors hover:shadow-md ${statusColors[reservation.status]}`}
                      onClick={() => onReservationClick?.(reservation)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {reservation.customerName}
                          </div>
                          <div className="text-xs opacity-75">
                            Party of {reservation.partySize}
                            {reservation.tableName && ` • Table ${reservation.tableName}`}
                          </div>
                          {reservation.specialRequests && (
                            <div className="text-xs mt-1 italic">
                              {reservation.specialRequests}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium">
                          {statusLabels[reservation.status]}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayReservations = getReservationsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={day.toDateString()}
              className={`border rounded-lg p-2 ${isToday ? 'border-primary-300 bg-primary-50' : 'border-secondary-200'}`}
            >
              <div className="text-center font-medium text-sm mb-2">
                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`text-lg ${isToday ? 'text-primary-600' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {dayReservations.slice(0, 3).map(reservation => (
                  <div
                    key={reservation.id}
                    className={`text-xs p-1 rounded cursor-pointer ${statusColors[reservation.status]}`}
                    onClick={() => onReservationClick?.(reservation)}
                  >
                    <div className="font-medium truncate">
                      {reservation.customerName}
                    </div>
                    <div className="opacity-75">
                      {reservation.startTime} • {reservation.partySize}p
                    </div>
                  </div>
                ))}
                {dayReservations.length > 3 && (
                  <div className="text-xs text-secondary-500 text-center">
                    +{dayReservations.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const monthDays = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      monthDays.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
      
      // Stop after we've displayed a full week beyond the last day
      if (currentDay > lastDay && currentDay.getDay() === 0) {
        break;
      }
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-sm text-secondary-700 p-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {monthDays.map(day => {
          const dayReservations = getReservationsForDate(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={day.toDateString()}
              className={`border rounded p-1 min-h-[80px] ${isCurrentMonth ? 'border-secondary-200' : 'border-secondary-100 bg-secondary-50'} ${isToday ? 'border-primary-300 bg-primary-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-secondary-900' : 'text-secondary-400'} ${isToday ? 'text-primary-600' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayReservations.slice(0, 2).map(reservation => (
                  <div
                    key={reservation.id}
                    className={`text-xs p-1 rounded cursor-pointer truncate ${statusColors[reservation.status]}`}
                    onClick={() => onReservationClick?.(reservation)}
                    title={`${reservation.customerName} - ${reservation.startTime}`}
                  >
                    {reservation.startTime} {reservation.customerName}
                  </div>
                ))}
                {dayReservations.length > 2 && (
                  <div className="text-xs text-secondary-500">
                    +{dayReservations.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>{formatDate(currentDate)}</CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary-100 rounded-md p-1">
              <Button
                variant={viewMode === 'day' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-secondary-500">Loading calendar...</div>
          </div>
        ) : (
          <>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </>
        )}
      </CardContent>
    </Card>
  );
}