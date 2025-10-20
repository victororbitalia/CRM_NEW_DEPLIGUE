import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface TimeSlot {
  time: string;
  available: boolean;
  tables: Array<{
    id: string;
    number: string;
    capacity: number;
    area: string;
  }>;
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

export interface AvailabilityRequest {
  date: Date;
  partySize: number;
  duration?: number;
  areaId?: string;
}

interface UseAvailabilityOptions {
  cacheResults?: boolean;
  cacheExpiry?: number; // in milliseconds
}

export const useAvailability = (options: UseAvailabilityOptions = {}) => {
  const { cacheResults = true, cacheExpiry = 300000 } = options; // 5 minutes default cache
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, { result: AvailabilityResult; timestamp: number }>>(new Map());
  const { showSuccess, showError } = useNotifications();

  // Generate cache key from request parameters
  const getCacheKey = useCallback((request: AvailabilityRequest): string => {
    const { date, partySize, duration = 120, areaId } = request;
    return `${date.toISOString().split('T')[0]}-${partySize}-${duration}-${areaId || 'all'}`;
  }, []);

  // Check if cached result is still valid
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < cacheExpiry;
  }, [cacheExpiry]);

  // Check availability
  const checkAvailability = useCallback(async (request: AvailabilityRequest): Promise<AvailabilityResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (cacheResults) {
        const cacheKey = getCacheKey(request);
        const cachedItem = cache.get(cacheKey);
        
        if (cachedItem && isCacheValid(cachedItem.timestamp)) {
          return cachedItem.result;
        }
      }

      const { date, partySize, duration = 120, areaId } = request;
      
      const response = await fetch('/api/reservations/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          partySize,
          duration,
          areaId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        
        // Cache the result
        if (cacheResults) {
          const cacheKey = getCacheKey(request);
          setCache(prev => new Map(prev).set(cacheKey, {
            result,
            timestamp: Date.now(),
          }));
        }
        
        return result;
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
  }, [cacheResults, cacheExpiry, getCacheKey, isCacheValid, cache, showError]);

  // Check availability for multiple dates
  const checkMultipleDatesAvailability = useCallback(async (
    requests: AvailabilityRequest[]
  ): Promise<(AvailabilityResult | null)[]> => {
    const results: (AvailabilityResult | null)[] = [];
    
    // Process requests in parallel with a limit of concurrent requests
    const concurrentLimit = 5;
    for (let i = 0; i < requests.length; i += concurrentLimit) {
      const batch = requests.slice(i, i + concurrentLimit);
      const batchPromises = batch.map(request => checkAvailability(request));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }, [checkAvailability]);

  // Find next available time slot
  const findNextAvailable = useCallback(async (
    request: AvailabilityRequest,
    searchDays: number = 7
  ): Promise<{ date: Date; timeSlot: TimeSlot } | null> => {
    const { date } = request;
    
    for (let i = 0; i < searchDays; i++) {
      const searchDate = new Date(date);
      searchDate.setDate(date.getDate() + i);
      
      const availability = await checkAvailability({
        ...request,
        date: searchDate,
      });
      
      if (availability && availability.available) {
        const availableTimeSlot = availability.timeSlots.find(slot => slot.available);
        
        if (availableTimeSlot) {
          return {
            date: searchDate,
            timeSlot: availableTimeSlot,
          };
        }
      }
    }
    
    return null;
  }, [checkAvailability]);

  // Get best available time slot based on preferences
  const getBestAvailableTime = useCallback(async (
    request: AvailabilityRequest,
    preferredTimes?: string[]
  ): Promise<TimeSlot | null> => {
    const availability = await checkAvailability(request);
    
    if (!availability || !availability.available) {
      return null;
    }
    
    const availableTimeSlots = availability.timeSlots.filter(slot => slot.available);
    
    if (availableTimeSlots.length === 0) {
      return null;
    }
    
    // If preferred times are provided, try to find a match
    if (preferredTimes && preferredTimes.length > 0) {
      for (const preferredTime of preferredTimes) {
        const matchingSlot = availableTimeSlots.find(slot => slot.time === preferredTime);
        if (matchingSlot) {
          return matchingSlot;
        }
      }
    }
    
    // Return the first available time slot
    return availableTimeSlots[0];
  }, [checkAvailability]);

  // Check if a specific time slot is available
  const isTimeSlotAvailable = useCallback(async (
    request: AvailabilityRequest,
    time: string
  ): Promise<boolean> => {
    const availability = await checkAvailability(request);
    
    if (!availability) {
      return false;
    }
    
    const timeSlot = availability.timeSlots.find(slot => slot.time === time);
    return timeSlot ? timeSlot.available : false;
  }, [checkAvailability]);

  // Get available tables for a specific time slot
  const getAvailableTables = useCallback(async (
    request: AvailabilityRequest,
    time: string
  ): Promise<Array<{
    id: string;
    number: string;
    capacity: number;
    area: string;
  }> | null> => {
    const availability = await checkAvailability(request);
    
    if (!availability) {
      return null;
    }
    
    const timeSlot = availability.timeSlots.find(slot => slot.time === time);
    return timeSlot ? timeSlot.tables : null;
  }, [checkAvailability]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Get cached result (if available)
  const getCachedResult = useCallback((request: AvailabilityRequest): AvailabilityResult | null => {
    if (!cacheResults) return null;
    
    const cacheKey = getCacheKey(request);
    const cachedItem = cache.get(cacheKey);
    
    if (cachedItem && isCacheValid(cachedItem.timestamp)) {
      return cachedItem.result;
    }
    
    return null;
  }, [cacheResults, getCacheKey, isCacheValid, cache]);

  return {
    // State
    isLoading,
    error,
    
    // Core functionality
    checkAvailability,
    checkMultipleDatesAvailability,
    
    // Helper functions
    findNextAvailable,
    getBestAvailableTime,
    isTimeSlotAvailable,
    getAvailableTables,
    
    // Cache management
    getCachedResult,
    clearCache,
  };
};

export default useAvailability;