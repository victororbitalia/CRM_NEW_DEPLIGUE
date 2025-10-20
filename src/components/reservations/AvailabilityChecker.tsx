'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Badge from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';

interface TimeSlot {
  time: string;
  available: boolean;
  tables: Array<{
    id: string;
    number: string;
    capacity: number;
    area: string;
  }>;
}

interface AvailabilityResult {
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

interface Area {
  id: string;
  name: string;
}

interface AvailabilityCheckerProps {
  onReservationRequest?: (data: {
    date: Date;
    time: string;
    partySize: number;
    tableId?: string;
    areaId?: string;
  }) => void;
  isLoading?: boolean;
}

const timeOptions = [
  { value: '120', label: '2 hours' },
  { value: '90', label: '1.5 hours' },
  { value: '60', label: '1 hour' },
];

export default function AvailabilityChecker({
  onReservationRequest,
  isLoading = false,
}: AvailabilityCheckerProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [partySize, setPartySize] = useState(2);
  const [duration, setDuration] = useState(120);
  const [areaId, setAreaId] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Mock areas data
  const [areas] = useState<Area[]>([
    { id: '1', name: 'Interior' },
    { id: '2', name: 'Terrace' },
    { id: '3', name: 'Private Room' },
  ]);

  const areaOptions = [
    { value: '', label: 'All Areas' },
    ...areas.map(area => ({
      value: area.id,
      label: area.name,
    })),
  ];

  const checkAvailability = async () => {
    try {
      setIsChecking(true);
      
      // In a real implementation, this would call the API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockTimeSlots: TimeSlot[] = [
        {
          time: '19:00',
          available: true,
          tables: [
            { id: '1', number: '1', capacity: 4, area: 'Interior' },
            { id: '2', number: '2', capacity: 2, area: 'Interior' },
          ],
        },
        {
          time: '19:30',
          available: true,
          tables: [
            { id: '3', number: '3', capacity: 6, area: 'Terrace' },
          ],
        },
        {
          time: '20:00',
          available: false,
          tables: [],
        },
        {
          time: '20:30',
          available: true,
          tables: [
            { id: '4', number: '4', capacity: 4, area: 'Interior' },
            { id: '5', number: '5', capacity: 2, area: 'Terrace' },
          ],
        },
        {
          time: '21:00',
          available: true,
          tables: [
            { id: '6', number: '6', capacity: 4, area: 'Private Room' },
          ],
        },
        {
          time: '21:30',
          available: false,
          tables: [],
        },
      ];
      
      const mockResult: AvailabilityResult = {
        available: mockTimeSlots.some(slot => slot.available),
        date: date.toISOString().split('T')[0],
        partySize,
        duration,
        operatingHours: {
          open: '19:00',
          close: '23:00',
        },
        timeSlots: mockTimeSlots,
      };
      
      setAvailabilityResult(mockResult);
      showSuccess('Availability checked successfully');
    } catch (error) {
      showError('Failed to check availability');
      console.error('Error checking availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.available) return;
    
    setSelectedTimeSlot(timeSlot);
    setSelectedTableId(''); // Reset selected table when changing time slot
  };

  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  const handleCreateReservation = () => {
    if (!selectedTimeSlot) {
      showError('Please select a time slot');
      return;
    }

    if (onReservationRequest) {
      onReservationRequest({
        date,
        time: selectedTimeSlot.time,
        partySize,
        tableId: selectedTableId || undefined,
        areaId: areaId || undefined,
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTableOptions = () => {
    if (!selectedTimeSlot) return [];
    
    return selectedTimeSlot.tables.map(table => ({
      value: table.id,
      label: `Table ${table.number} (Capacity: ${table.capacity}, Area: ${table.area})`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Check Availability</h2>
        <p className="text-secondary-600">
          Find available tables for your desired date and time
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Date
              </label>
              <DatePicker
                value={date}
                onChange={(newDate) => setDate(newDate || new Date())}
                placeholder="Select date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Party Size
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                placeholder="Number of guests"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Duration
              </label>
              <Select
                value={duration.toString()}
                onChange={(value) => setDuration(parseInt(value as string))}
                options={timeOptions}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Area
              </label>
              <Select
                value={areaId}
                onChange={(value) => setAreaId(value as string)}
                options={areaOptions}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={checkAvailability}
              disabled={isChecking}
              className="w-full md:w-auto"
            >
              {isChecking ? 'Checking...' : 'Check Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {availabilityResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              Availability for {formatDate(date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-secondary-50 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-secondary-700">Status: </span>
                  <Badge className={availabilityResult.available ? 'bg-success-100 text-success-800 border-success-200' : 'bg-error-100 text-error-800 border-error-200'}>
                    {availabilityResult.available ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                
                <div className="text-sm text-secondary-600">
                  Party Size: {availabilityResult.partySize} guests • 
                  Duration: {availabilityResult.duration} minutes • 
                  Operating Hours: {availabilityResult.operatingHours.open} - {availabilityResult.operatingHours.close}
                </div>
              </div>
            </div>
            
            {availabilityResult.available ? (
              <div>
                <h3 className="text-lg font-medium text-secondary-900 mb-4">
                  Available Time Slots
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {availabilityResult.timeSlots.map((timeSlot) => (
                    <div
                      key={timeSlot.time}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        timeSlot.available
                          ? selectedTimeSlot?.time === timeSlot.time
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50'
                          : 'border-secondary-200 bg-secondary-50 opacity-60'
                      }`}
                      onClick={() => handleTimeSlotSelect(timeSlot)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-secondary-900">
                          {timeSlot.time}
                        </h4>
                        <Badge className={
                          timeSlot.available
                            ? 'bg-success-100 text-success-800 border-success-200'
                            : 'bg-error-100 text-error-800 border-error-200'
                        }>
                          {timeSlot.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      {timeSlot.available ? (
                        <div>
                          <p className="text-sm text-secondary-600 mb-2">
                            {timeSlot.tables.length} table{timeSlot.tables.length !== 1 ? 's' : ''} available
                          </p>
                          
                          {selectedTimeSlot?.time === timeSlot.time && (
                            <div className="mt-3 space-y-2">
                              <label className="block text-sm font-medium text-secondary-700">
                                Select Table (Optional)
                              </label>
                              <Select
                                value={selectedTableId}
                                onChange={(value) => handleTableSelect(value as string)}
                                options={getTableOptions()}
                                placeholder="No preference"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-secondary-500">
                          No tables available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedTimeSlot && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleCreateReservation}
                      disabled={isLoading}
                      size="lg"
                    >
                      Create Reservation for {selectedTimeSlot.time}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-secondary-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No Availability
                </h3>
                <p className="text-secondary-600 mb-4">
                  There are no available tables for the selected date and party size.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-secondary-500">
                    Suggestions:
                  </p>
                  <ul className="text-sm text-secondary-500 list-disc list-inside space-y-1">
                    <li>Try a different date</li>
                    <li>Try a different party size</li>
                    <li>Try a different duration</li>
                    <li>Consider joining the waitlist</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}