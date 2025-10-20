import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
}

export interface Area {
  id: string;
  name: string;
}

export interface WaitlistEntry {
  id: string;
  customer: Customer;
  restaurantId: string;
  date: Date;
  partySize: number;
  preferredTime?: string;
  areaId?: string;
  area?: Area;
  specialRequests?: string;
  status: 'waiting' | 'offered' | 'declined' | 'expired';
  priority: number;
  offeredAt?: Date;
  expiresAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWaitlistEntryData {
  customerId: string;
  date: Date;
  partySize: number;
  preferredTime?: string;
  areaId?: string;
  specialRequests?: string;
  notes?: string;
  priority?: number;
}

export interface UpdateWaitlistEntryData extends Partial<CreateWaitlistEntryData> {
  id: string;
  status?: 'waiting' | 'offered' | 'declined' | 'expired';
}

export interface WaitlistFilters {
  date?: Date;
  status?: string;
  customerId?: string;
  areaId?: string;
  search?: string;
}

interface UseWaitlistOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: WaitlistFilters;
}

export const useWaitlist = (options: UseWaitlistOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 60000, initialFilters = {} } = options;
  
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WaitlistFilters>(initialFilters);
  const { showSuccess, showError } = useNotifications();

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch waitlist entries
  const fetchWaitlistEntries = useCallback(async (customFilters?: WaitlistFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Apply filters
      const activeFilters = customFilters || filters;
      
      if (activeFilters.date) {
        params.append('date', activeFilters.date.toISOString().split('T')[0]);
      }
      
      if (activeFilters.status) {
        params.append('status', activeFilters.status);
      }
      
      if (activeFilters.customerId) {
        params.append('customerId', activeFilters.customerId);
      }
      
      if (activeFilters.areaId) {
        params.append('areaId', activeFilters.areaId);
      }
      
      if (activeFilters.search) {
        params.append('search', activeFilters.search);
      }

      const response = await fetch(`/api/reservations/waitlist?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const processedEntries = data.data.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          expiresAt: new Date(entry.expiresAt),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
          offeredAt: entry.offeredAt ? new Date(entry.offeredAt) : undefined,
        }));
        
        setWaitlistEntries(processedEntries);
      } else {
        setError(data.error || 'Failed to fetch waitlist entries');
        showError(data.error || 'Failed to fetch waitlist entries');
      }
    } catch (err) {
      const errorMessage = 'Connection error while fetching waitlist entries';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, showError]);

  // Create waitlist entry
  const createWaitlistEntry = useCallback(async (entryData: CreateWaitlistEntryData): Promise<WaitlistEntry | null> => {
    try {
      const response = await fetch('/api/reservations/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(entryData),
      });

      const data = await response.json();

      if (data.success) {
        const newEntry = {
          ...data.data,
          date: new Date(data.data.date),
          expiresAt: new Date(data.data.expiresAt),
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };
        
        setWaitlistEntries(prev => [...prev, newEntry]);
        showSuccess('Waitlist entry created successfully');
        return newEntry;
      } else {
        showError(data.error || 'Failed to create waitlist entry');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while creating waitlist entry';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Update waitlist entry
  const updateWaitlistEntry = useCallback(async (entryData: UpdateWaitlistEntryData): Promise<WaitlistEntry | null> => {
    try {
      const { id, ...updateData } = entryData;
      
      const response = await fetch(`/api/reservations/waitlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        const updatedEntry = {
          ...data.data,
          date: new Date(data.data.date),
          expiresAt: new Date(data.data.expiresAt),
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
          offeredAt: data.data.offeredAt ? new Date(data.data.offeredAt) : undefined,
        };
        
        setWaitlistEntries(prev => prev.map(entry => 
          entry.id === id ? updatedEntry : entry
        ));
        
        showSuccess('Waitlist entry updated successfully');
        return updatedEntry;
      } else {
        showError(data.error || 'Failed to update waitlist entry');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while updating waitlist entry';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Delete waitlist entry
  const deleteWaitlistEntry = useCallback(async (entryId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reservations/waitlist/${entryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setWaitlistEntries(prev => prev.filter(entry => entry.id !== entryId));
        showSuccess('Waitlist entry removed successfully');
        return true;
      } else {
        showError(data.error || 'Failed to remove waitlist entry');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Connection error while removing waitlist entry';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Offer table to waitlist entry
  const offerTable = useCallback(async (entryId: string, tableId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reservations/waitlist/${entryId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ tableId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the entry status to 'offered'
        setWaitlistEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                status: 'offered',
                offeredAt: new Date(),
                updatedAt: new Date(),
              }
            : entry
        ));
        
        showSuccess('Table offered to customer successfully');
        return true;
      } else {
        showError(data.error || 'Failed to offer table to customer');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Connection error while offering table to customer';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Get waitlist entry by ID
  const getWaitlistEntryById = useCallback((entryId: string): WaitlistEntry | null => {
    return waitlistEntries.find(entry => entry.id === entryId) || null;
  }, [waitlistEntries]);

  // Filter waitlist entries
  const filterWaitlistEntries = useCallback((customFilters: WaitlistFilters): WaitlistEntry[] => {
    let filtered = [...waitlistEntries];

    if (customFilters.date) {
      const filterDate = new Date(customFilters.date);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === filterDate.toDateString();
      });
    }

    if (customFilters.status) {
      filtered = filtered.filter(entry => entry.status === customFilters.status);
    }

    if (customFilters.customerId) {
      filtered = filtered.filter(entry => entry.customer.id === customFilters.customerId);
    }

    if (customFilters.areaId) {
      filtered = filtered.filter(entry => entry.areaId === customFilters.areaId);
    }

    if (customFilters.search) {
      const searchTerm = customFilters.search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.customer.firstName.toLowerCase().includes(searchTerm) ||
        entry.customer.lastName.toLowerCase().includes(searchTerm) ||
        entry.customer.email.toLowerCase().includes(searchTerm) ||
        (entry.customer.phone && entry.customer.phone.includes(searchTerm)) ||
        (entry.specialRequests && entry.specialRequests.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by priority and creation time
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Earlier first
    });

    return filtered;
  }, [waitlistEntries]);

  // Get waitlist statistics
  const getWaitlistStats = useCallback(() => {
    const stats = {
      total: waitlistEntries.length,
      waiting: 0,
      offered: 0,
      declined: 0,
      expired: 0,
    };

    waitlistEntries.forEach(entry => {
      switch (entry.status) {
        case 'waiting':
          stats.waiting++;
          break;
        case 'offered':
          stats.offered++;
          break;
        case 'declined':
          stats.declined++;
          break;
        case 'expired':
          stats.expired++;
          break;
      }
    });

    return stats;
  }, [waitlistEntries]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<WaitlistFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Process expired entries
  const processExpiredEntries = useCallback(async (): Promise<number> => {
    try {
      const now = new Date();
      const expiredEntries = waitlistEntries.filter(
        entry => entry.status === 'waiting' && new Date(entry.expiresAt) < now
      );

      let processedCount = 0;
      for (const entry of expiredEntries) {
        const success = await updateWaitlistEntry({
          id: entry.id,
          status: 'expired',
        });
        if (success) processedCount++;
      }

      if (processedCount > 0) {
        showSuccess(`${processedCount} expired entries processed`);
      }

      return processedCount;
    } catch (err) {
      const errorMessage = 'Error processing expired entries';
      showError(errorMessage);
      return 0;
    }
  }, [waitlistEntries, updateWaitlistEntry, showSuccess, showError]);

  // Get next customer to offer a table
  const getNextCustomer = useCallback((partySize: number, areaId?: string): WaitlistEntry | null => {
    const waitingEntries = waitlistEntries.filter(entry => 
      entry.status === 'waiting' && 
      entry.partySize <= partySize &&
      (!areaId || entry.areaId === areaId || !entry.areaId)
    );

    if (waitingEntries.length === 0) return null;

    // Sort by priority and creation time
    waitingEntries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Earlier first
    });

    return waitingEntries[0];
  }, [waitlistEntries]);

  // Load initial data
  useEffect(() => {
    fetchWaitlistEntries();
  }, [fetchWaitlistEntries]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWaitlistEntries();
      processExpiredEntries();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWaitlistEntries, processExpiredEntries]);

  return {
    // Data
    waitlistEntries,
    isLoading,
    error,
    filters,
    
    // CRUD operations
    fetchWaitlistEntries,
    createWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    
    // Special operations
    offerTable,
    processExpiredEntries,
    
    // Query operations
    getWaitlistEntryById,
    filterWaitlistEntries,
    getWaitlistStats,
    getNextCustomer,
    
    // Filter operations
    updateFilters,
    clearFilters,
    
    // Utility
    refetch: () => fetchWaitlistEntries(),
  };
};

export default useWaitlist;