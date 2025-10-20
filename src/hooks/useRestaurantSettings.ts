import { useState, useEffect, useCallback } from 'react';
import { 
  RestaurantSettings, 
  UpdateRestaurantSettingsData,
  ApiResponse 
} from '@/types';

interface UseRestaurantSettingsOptions {
  autoFetch?: boolean;
}

interface UseRestaurantSettingsReturn {
  settings: RestaurantSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (restaurantId: string) => Promise<void>;
  updateSettings: (restaurantId: string, data: UpdateRestaurantSettingsData) => Promise<RestaurantSettings | null>;
  clearError: () => void;
  clearSettings: () => void;
}

export const useRestaurantSettings = (
  restaurantId?: string,
  options: UseRestaurantSettingsOptions = {}
): UseRestaurantSettingsReturn => {
  const { autoFetch = true } = options;
  
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSettings = useCallback(() => {
    setSettings(null);
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSettings = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/settings`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<RestaurantSettings> = await response.json();

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to fetch restaurant settings');
      }
    } catch (err) {
      setError('Network error occurred while fetching restaurant settings');
      console.error('Error fetching restaurant settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (
    id: string, 
    data: UpdateRestaurantSettingsData
  ): Promise<RestaurantSettings | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<RestaurantSettings> = await response.json();

      if (result.success && result.data) {
        // Update the settings in state
        setSettings(result.data);
        return result.data;
      } else {
        setError(result.error || 'Failed to update restaurant settings');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while updating restaurant settings');
      console.error('Error updating restaurant settings:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount if restaurantId is provided and autoFetch is enabled
  useEffect(() => {
    if (autoFetch && restaurantId) {
      fetchSettings(restaurantId);
    }
  }, [autoFetch, restaurantId, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    clearError,
    clearSettings,
  };
};