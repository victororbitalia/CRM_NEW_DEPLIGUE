import { useState, useEffect, useCallback } from 'react';
import { 
  OperatingHour, 
  CreateOperatingHourData, 
  UpdateOperatingHourData,
  ApiResponse 
} from '@/types';

interface UseOperatingHoursOptions {
  autoFetch?: boolean;
  includeSpecial?: boolean;
}

interface UseOperatingHoursReturn {
  operatingHours: OperatingHour[];
  loading: boolean;
  error: string | null;
  fetchOperatingHours: (restaurantId: string) => Promise<void>;
  createOperatingHour: (restaurantId: string, data: CreateOperatingHourData) => Promise<OperatingHour | null>;
  updateOperatingHours: (restaurantId: string, hours: UpdateOperatingHourData[]) => Promise<OperatingHour[] | null>;
  deleteOperatingHour: (restaurantId: string, hourId: string) => Promise<boolean>;
  clearError: () => void;
  getHoursByDay: (dayOfWeek: number) => OperatingHour[];
  getRegularHours: () => OperatingHour[];
  getSpecialHours: () => OperatingHour[];
}

export const useOperatingHours = (
  restaurantId?: string,
  options: UseOperatingHoursOptions = {}
): UseOperatingHoursReturn => {
  const { autoFetch = true, includeSpecial = false } = options;
  
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchOperatingHours = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (includeSpecial) {
        queryParams.append('includeSpecial', 'true');
      }

      const response = await fetch(`/api/restaurants/${id}/hours?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<OperatingHour[]> = await response.json();

      if (result.success && result.data) {
        setOperatingHours(result.data);
      } else {
        setError(result.error || 'Failed to fetch operating hours');
      }
    } catch (err) {
      setError('Network error occurred while fetching operating hours');
      console.error('Error fetching operating hours:', err);
    } finally {
      setLoading(false);
    }
  }, [includeSpecial]);

  const createOperatingHour = useCallback(async (
    id: string, 
    data: CreateOperatingHourData
  ): Promise<OperatingHour | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/hours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<OperatingHour> = await response.json();

      if (result.success && result.data) {
        // Add the new operating hour to the list
        setOperatingHours(prev => [...prev, result.data!]);
        return result.data;
      } else {
        setError(result.error || 'Failed to create operating hour');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while creating operating hour');
      console.error('Error creating operating hour:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOperatingHours = useCallback(async (
    id: string, 
    hours: UpdateOperatingHourData[]
  ): Promise<OperatingHour[] | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ hours }),
      });

      const result: ApiResponse<OperatingHour[]> = await response.json();

      if (result.success && result.data) {
        // Update the operating hours in the list
        setOperatingHours(prev => {
          const updatedHours = [...prev];
          result.data!.forEach(updatedHour => {
            const index = updatedHours.findIndex(h => h.id === updatedHour.id);
            if (index !== -1) {
              updatedHours[index] = updatedHour;
            } else {
              updatedHours.push(updatedHour);
            }
          });
          return updatedHours;
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to update operating hours');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while updating operating hours');
      console.error('Error updating operating hours:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOperatingHour = useCallback(async (
    id: string, 
    hourId: string
  ): Promise<boolean> => {
    if (!id || !hourId) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/hours/${hourId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Remove the operating hour from the list
        setOperatingHours(prev => prev.filter(h => h.id !== hourId));
        return true;
      } else {
        setError(result.error || 'Failed to delete operating hour');
        return false;
      }
    } catch (err) {
      setError('Network error occurred while deleting operating hour');
      console.error('Error deleting operating hour:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHoursByDay = useCallback((dayOfWeek: number): OperatingHour[] => {
    return operatingHours.filter(hour => hour.dayOfWeek === dayOfWeek);
  }, [operatingHours]);

  const getRegularHours = useCallback((): OperatingHour[] => {
    return operatingHours.filter(hour => !hour.isSpecialDay);
  }, [operatingHours]);

  const getSpecialHours = useCallback((): OperatingHour[] => {
    return operatingHours.filter(hour => hour.isSpecialDay);
  }, [operatingHours]);

  // Auto-fetch on mount if restaurantId is provided and autoFetch is enabled
  useEffect(() => {
    if (autoFetch && restaurantId) {
      fetchOperatingHours(restaurantId);
    }
  }, [autoFetch, restaurantId, fetchOperatingHours]);

  return {
    operatingHours,
    loading,
    error,
    fetchOperatingHours,
    createOperatingHour,
    updateOperatingHours,
    deleteOperatingHour,
    clearError,
    getHoursByDay,
    getRegularHours,
    getSpecialHours,
  };
};