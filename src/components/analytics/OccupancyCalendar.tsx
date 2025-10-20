import React, { useState } from 'react';
import Card from '@/components/ui/Card';

interface DayData {
  date: string;
  totalTables: number;
  occupiedTables: number;
  occupancyRate: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  revenue: number;
}

interface OccupancyCalendarProps {
  data: DayData[];
  title?: string;
  height?: number;
  loading?: boolean;
  className?: string;
}

export const OccupancyCalendar: React.FC<OccupancyCalendarProps> = ({
  data,
  title = 'Occupancy Calendar',
  height = 400,
  loading = false,
  className = '',
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get week days
  const getWeekDays = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  // Get data for a specific date
  const getDataForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return data.find(d => d.date === dateStr);
  };

  // Get occupancy color based on rate
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 75) return 'bg-orange-500';
    if (rate >= 50) return 'bg-yellow-500';
    if (rate >= 25) return 'bg-green-500';
    return 'bg-gray-200';
  };

  // Navigate to previous month
  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  // Navigate to previous week
  const previousWeek = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), selectedMonth.getDate() - 7));
  };

  // Navigate to next week
  const nextWeek = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), selectedMonth.getDate() + 7));
  };

  // Get week view dates
  const getWeekDates = () => {
    const startOfWeek = new Date(selectedMonth);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth(selectedMonth);
    const weekDays = getWeekDays();

    return (
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[600px]">
          {/* Week day headers */}
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2"></div>;
            }

            const dayData = getDataForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const occupancyColor = dayData ? getOccupancyColor(dayData.occupancyRate) : 'bg-gray-200';

            return (
              <div
                key={index}
                className={`border border-gray-200 rounded p-1 cursor-pointer hover:bg-gray-50 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                title={date.toLocaleDateString()}
              >
                <div className="text-xs font-medium text-gray-900 mb-1">
                  {date.getDate()}
                </div>
                {dayData && (
                  <div className="space-y-1">
                    <div className={`h-4 rounded ${occupancyColor}`}></div>
                    <div className="text-xs text-gray-600 text-center">
                      {dayData.occupancyRate}%
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {dayData.totalReservations} res
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {dayData.occupiedTables}/{dayData.totalTables}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const weekDays = getWeekDays();

    return (
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[800px]">
          {/* Week day headers */}
          {weekDates.map((date, index) => (
            <div key={index} className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">
                {weekDays[index]}
              </div>
              <div className={`text-sm font-medium text-gray-900 p-2 rounded ${
                new Date().toDateString() === date.toDateString() ? 'bg-blue-100 text-blue-800' : ''
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
          
          {/* Week day details */}
          {weekDates.map((date, index) => {
            const dayData = getDataForDate(date);
            const occupancyColor = dayData ? getOccupancyColor(dayData.occupancyRate) : 'bg-gray-200';

            return (
              <div key={index} className="border border-gray-200 rounded p-2">
                {dayData ? (
                  <div className="space-y-2">
                    <div className={`h-8 rounded ${occupancyColor} flex items-center justify-center`}>
                      <span className="text-xs font-medium text-white">
                        {dayData.occupancyRate}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Reservations: {dayData.totalReservations}</div>
                      <div>Completed: {dayData.completedReservations}</div>
                      <div>Cancelled: {dayData.cancelledReservations}</div>
                      <div>Tables: {dayData.occupiedTables}/{dayData.totalTables}</div>
                      <div>Revenue: ${dayData.revenue.toFixed(0)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No data
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render legend
  const renderLegend = () => (
    <div className="flex items-center justify-center space-x-4 mt-4">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <span className="text-xs text-gray-600">0-25%</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
        <span className="text-xs text-gray-600">25-50%</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
        <span className="text-xs text-gray-600">50-75%</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
        <span className="text-xs text-gray-600">75-90%</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
        <span className="text-xs text-gray-600">90-100%</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'month'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'week'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={viewMode === 'month' ? previousMonth : previousWeek}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h4 className="text-md font-medium text-gray-900">
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <button
          onClick={viewMode === 'month' ? nextMonth : nextWeek}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar */}
      <div style={{ height: `${height}px` }}>
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* Legend */}
      {renderLegend()}
    </Card>
  );
};

export default OccupancyCalendar;