import { useState, useEffect, useCallback } from 'react';
import { 
  BusinessRule, 
  CreateBusinessRuleData, 
  UpdateBusinessRuleData,
  ApiResponse 
} from '@/types';

interface UseBusinessRulesOptions {
  autoFetch?: boolean;
  includeInactive?: boolean;
  ruleType?: string;
}

interface UseBusinessRulesReturn {
  businessRules: BusinessRule[];
  loading: boolean;
  error: string | null;
  fetchBusinessRules: (restaurantId: string) => Promise<void>;
  createBusinessRule: (restaurantId: string, data: CreateBusinessRuleData) => Promise<BusinessRule | null>;
  updateBusinessRules: (restaurantId: string, rules: UpdateBusinessRuleData[]) => Promise<BusinessRule[] | null>;
  deleteBusinessRule: (restaurantId: string, ruleId: string) => Promise<boolean>;
  clearError: () => void;
  getActiveRules: () => BusinessRule[];
  getRulesByType: (type: string) => BusinessRule[];
  getRuleById: (id: string) => BusinessRule | undefined;
  getRulesByPriority: () => BusinessRule[];
}

export const useBusinessRules = (
  restaurantId?: string,
  options: UseBusinessRulesOptions = {}
): UseBusinessRulesReturn => {
  const { autoFetch = true, includeInactive = false, ruleType } = options;
  
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
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

  const fetchBusinessRules = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (includeInactive) {
        queryParams.append('includeInactive', 'true');
      }
      if (ruleType) {
        queryParams.append('type', ruleType);
      }

      const response = await fetch(`/api/restaurants/${id}/rules?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result: ApiResponse<BusinessRule[]> = await response.json();

      if (result.success && result.data) {
        setBusinessRules(result.data);
      } else {
        setError(result.error || 'Failed to fetch business rules');
      }
    } catch (err) {
      setError('Network error occurred while fetching business rules');
      console.error('Error fetching business rules:', err);
    } finally {
      setLoading(false);
    }
  }, [includeInactive, ruleType]);

  const createBusinessRule = useCallback(async (
    id: string, 
    data: CreateBusinessRuleData
  ): Promise<BusinessRule | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<BusinessRule> = await response.json();

      if (result.success && result.data) {
        // Add the new business rule to the list
        setBusinessRules(prev => [...prev, result.data!]);
        return result.data;
      } else {
        setError(result.error || 'Failed to create business rule');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while creating business rule');
      console.error('Error creating business rule:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusinessRules = useCallback(async (
    id: string, 
    rulesToUpdate: UpdateBusinessRuleData[]
  ): Promise<BusinessRule[] | null> => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ rules: rulesToUpdate }),
      });

      const result: ApiResponse<BusinessRule[]> = await response.json();

      if (result.success && result.data) {
        // Update the business rules in the list
        setBusinessRules(prev => {
          const updatedRules = [...prev];
          result.data!.forEach(updatedRule => {
            const index = updatedRules.findIndex(r => r.id === updatedRule.id);
            if (index !== -1) {
              updatedRules[index] = updatedRule;
            } else {
              updatedRules.push(updatedRule);
            }
          });
          return updatedRules;
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to update business rules');
        return null;
      }
    } catch (err) {
      setError('Network error occurred while updating business rules');
      console.error('Error updating business rules:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBusinessRule = useCallback(async (
    id: string, 
    ruleId: string
  ): Promise<boolean> => {
    if (!id || !ruleId) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/restaurants/${id}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        // Remove the business rule from the list
        setBusinessRules(prev => prev.filter(r => r.id !== ruleId));
        return true;
      } else {
        setError(result.error || 'Failed to delete business rule');
        return false;
      }
    } catch (err) {
      setError('Network error occurred while deleting business rule');
      console.error('Error deleting business rule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveRules = useCallback((): BusinessRule[] => {
    return businessRules.filter(rule => rule.isActive);
  }, [businessRules]);

  const getRulesByType = useCallback((type: string): BusinessRule[] => {
    return businessRules.filter(rule => rule.ruleType === type);
  }, [businessRules]);

  const getRuleById = useCallback((id: string): BusinessRule | undefined => {
    return businessRules.find(rule => rule.id === id);
  }, [businessRules]);

  const getRulesByPriority = useCallback((): BusinessRule[] => {
    return [...businessRules].sort((a, b) => a.priority - b.priority);
  }, [businessRules]);

  // Auto-fetch on mount if restaurantId is provided and autoFetch is enabled
  useEffect(() => {
    if (autoFetch && restaurantId) {
      fetchBusinessRules(restaurantId);
    }
  }, [autoFetch, restaurantId, fetchBusinessRules]);

  return {
    businessRules,
    loading,
    error,
    fetchBusinessRules,
    createBusinessRule,
    updateBusinessRules,
    deleteBusinessRule,
    clearError,
    getActiveRules,
    getRulesByType,
    getRuleById,
    getRulesByPriority,
  };
};