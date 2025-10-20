import { useState, useEffect, useCallback } from 'react';
import { 
  Restaurant, 
  RestaurantWithRelations, 
  CreateRestaurantData, 
  UpdateRestaurantData,
  ApiResponse 
} from '@/types';

interface UseRestaurantOptions {
  autoFetch?: boolean;
  includeInactive?: boolean;
}

interface UseRestaurantReturn {
  restaurants: RestaurantWithRelations[];
  restaurant: RestaurantWithRelations | null;
  loading: boolean;
  error: string | null;
  fetchRestaurants: () => Promise<void>;
  fetchRestaurant: (id: string) => Promise<void>;
  createRestaurant: (data: CreateRestaurantData) => Promise<Restaurant | null>;
  updateRestaurant: (id: string, data: UpdateRestaurantData) => Promise<Restaurant | null>;
  deleteRestaurant: (id: string) => Promise<boolean>;
  clearError: () => void;
  clearRestaurant: () => void;
}

export const useRestaurant = (
  initialRestaurantId?: string,
  options: UseRestaurantOptions = {}
): UseRestaurantReturn => {
  const { autoFetch = true, includeInactive = false } = options;
  
  const [restaurants, setRestaurants] = useState<RestaurantWithRelations[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearRestaurant = useCallback(() => {
    setRestaurant(null);
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (includeInactive) {
        queryParams.append('includeInactive', 'true');
      }

      const response = await fetch(`/api/restaurants?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<RestaurantWithRelations[]> = await response.json();

      if (result.success && result.data) {
        setRestaurants(result.data);
      } else {
        setError(result.error || 'Failed to fetch restaurants');
      }
    } catch (err) {
      setError('Network error occurred while fetching restaurants');
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  const fetchRestaurant = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<RestaurantWithRelations> = await response.json();

      if (result.success && result.data) {
        setRestaurant(result.data);
      } else {
        setError(result.error || 'Failed to fetch restaurant');
      }
    } catch (err) {
      setError('Network error occurred while fetching restaurant');
      console.error('Error fetching restaurant:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRestaurant = useCallback(async (data: CreateRestaurantData): Promise<Restaurant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Restaurant> = await response.json();

      if (result.success && result.data) {
        // Refresh the restaurants list
        await fetchRestaurants();
        return result.data;
      } else {
        setError(result.error || 'Failed to create restaurant');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while creating restaurant');
      console.error('Error creating restaurant:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants]);

  const updateRestaurant = useCallback(async (id: string, data: UpdateRestaurantData): Promise<Restaurant | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Restaurant> = await response.json();

      if (result.success && result.data) {
        // Update the restaurant in state if it's the current one
        if (restaurant && restaurant.id === id) {
          setRestaurant({ ...restaurant, ...result.data });
        }
        
        // Update the restaurant in the list
        setRestaurants(prev => 
          prev.map(r => r.id === id ? { ...r, ...result.data } : r)
        );
        
        return result.data;
      } else {
        setError(result.error || 'Failed to update restaurant');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while updating restaurant');
      console.error('Error updating restaurant:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  const deleteRestaurant = useCallback(async (id: string): Promise<boolean> => {
    if (!id) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Remove the restaurant from the list
        setRestaurants(prev => prev.filter(r => r.id !== id));
        
        // Clear the current restaurant if it's the one being deleted
        if (restaurant && restaurant.id === id) {
          setRestaurant(null);
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to delete restaurant');
        return false;
      }
    } catch (err) {
      setError('Network error occurred while deleting restaurant');
      console.error('Error deleting restaurant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRestaurants();
    }
  }, [autoFetch, fetchRestaurants]);

  // Auto-fetch specific restaurant if ID is provided
  useEffect(() => {
    if (initialRestaurantId) {
      fetchRestaurant(initialRestaurantId);
    }
  }, [initialRestaurantId, fetchRestaurant]);

  return {
    restaurants,
    restaurant,
    loading,
    error,
    fetchRestaurants,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    clearError,
    clearRestaurant,
  };
};