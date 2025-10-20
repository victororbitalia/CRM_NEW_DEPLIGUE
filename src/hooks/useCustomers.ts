import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
  preferences?: Record<string, any>;
  notes?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
  preferences?: Record<string, any>;
  notes?: string;
  isVip?: boolean;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
}

export interface CustomerFilters {
  search?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  hasReservations?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

interface UseCustomersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: CustomerFilters;
}

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 60000, initialFilters = {} } = options;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const { showSuccess, showError } = useNotifications();

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async (customFilters?: CustomerFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Apply filters
      const activeFilters = customFilters || filters;
      
      if (activeFilters.search) {
        params.append('search', activeFilters.search);
      }
      
      if (activeFilters.isVip !== undefined) {
        params.append('isVip', activeFilters.isVip.toString());
      }
      
      if (activeFilters.isBlacklisted !== undefined) {
        params.append('isBlacklisted', activeFilters.isBlacklisted.toString());
      }
      
      if (activeFilters.hasReservations !== undefined) {
        params.append('hasReservations', activeFilters.hasReservations.toString());
      }
      
      if (activeFilters.createdAfter) {
        params.append('createdAfter', activeFilters.createdAfter.toISOString());
      }
      
      if (activeFilters.createdBefore) {
        params.append('createdBefore', activeFilters.createdBefore.toISOString());
      }

      const response = await fetch(`/api/customers?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const processedCustomers = data.data.map((customer: any) => ({
          ...customer,
          dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : undefined,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt),
        }));
        
        setCustomers(processedCustomers);
      } else {
        setError(data.error || 'Failed to fetch customers');
        showError(data.error || 'Failed to fetch customers');
      }
    } catch (err) {
      const errorMessage = 'Connection error while fetching customers';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, showError]);

  // Create customer
  const createCustomer = useCallback(async (customerData: CreateCustomerData): Promise<Customer | null> => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (data.success) {
        const newCustomer = {
          ...data.data,
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };
        
        setCustomers(prev => [...prev, newCustomer]);
        showSuccess('Customer created successfully');
        return newCustomer;
      } else {
        showError(data.error || 'Failed to create customer');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while creating customer';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Update customer
  const updateCustomer = useCallback(async (customerData: UpdateCustomerData): Promise<Customer | null> => {
    try {
      const { id, ...updateData } = customerData;
      
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        const updatedCustomer = {
          ...data.data,
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };
        
        setCustomers(prev => prev.map(customer => 
          customer.id === id ? updatedCustomer : customer
        ));
        
        showSuccess('Customer updated successfully');
        return updatedCustomer;
      } else {
        showError(data.error || 'Failed to update customer');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while updating customer';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Delete customer
  const deleteCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setCustomers(prev => prev.filter(customer => customer.id !== customerId));
        showSuccess('Customer deleted successfully');
        return true;
      } else {
        showError(data.error || 'Failed to delete customer');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Connection error while deleting customer';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Get customer by ID
  const getCustomerById = useCallback((customerId: string): Customer | null => {
    return customers.find(customer => customer.id === customerId) || null;
  }, [customers]);

  // Get customer by email
  const getCustomerByEmail = useCallback((email: string): Customer | null => {
    return customers.find(customer => customer.email === email) || null;
  }, [customers]);

  // Search customers
  const searchCustomers = useCallback((query: string): Customer[] => {
    const searchTerm = query.toLowerCase();
    return customers.filter(customer =>
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers]);

  // Filter customers
  const filterCustomers = useCallback((customFilters: CustomerFilters): Customer[] => {
    let filtered = [...customers];

    if (customFilters.search) {
      const searchTerm = customFilters.search.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    if (customFilters.isVip !== undefined) {
      filtered = filtered.filter(customer => customer.isVip === customFilters.isVip);
    }

    if (customFilters.isBlacklisted !== undefined) {
      filtered = filtered.filter(customer => customer.isBlacklisted === customFilters.isBlacklisted);
    }

    if (customFilters.createdAfter) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) >= customFilters.createdAfter!
      );
    }

    if (customFilters.createdBefore) {
      filtered = filtered.filter(customer => 
        new Date(customer.createdAt) <= customFilters.createdBefore!
      );
    }

    return filtered;
  }, [customers]);

  // Toggle VIP status
  const toggleVipStatus = useCallback(async (customerId: string): Promise<boolean> => {
    const customer = getCustomerById(customerId);
    if (!customer) return false;

    return await updateCustomer({
      id: customerId,
      isVip: !customer.isVip,
    }) !== null;
  }, [getCustomerById, updateCustomer]);

  // Toggle blacklist status
  const toggleBlacklistStatus = useCallback(async (
    customerId: string, 
    reason?: string
  ): Promise<boolean> => {
    const customer = getCustomerById(customerId);
    if (!customer) return false;

    return await updateCustomer({
      id: customerId,
      isBlacklisted: !customer.isBlacklisted,
      blacklistReason: !customer.isBlacklisted ? reason : undefined,
    }) !== null;
  }, [getCustomerById, updateCustomer]);

  // Add note to customer
  const addNote = useCallback(async (customerId: string, note: string): Promise<boolean> => {
    const customer = getCustomerById(customerId);
    if (!customer) return false;

    const updatedNotes = customer.notes 
      ? `${customer.notes}\n\n${new Date().toLocaleDateString()}: ${note}`
      : `${new Date().toLocaleDateString()}: ${note}`;

    return await updateCustomer({
      id: customerId,
      notes: updatedNotes,
    }) !== null;
  }, [getCustomerById, updateCustomer]);

  // Get customer statistics
  const getCustomerStats = useCallback(() => {
    const stats = {
      total: customers.length,
      vip: customers.filter(customer => customer.isVip).length,
      blacklisted: customers.filter(customer => customer.isBlacklisted).length,
      withPhone: customers.filter(customer => customer.phone).length,
      withAddress: customers.filter(customer => customer.address).length,
      withNotes: customers.filter(customer => customer.notes).length,
    };

    return stats;
  }, [customers]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Load initial data
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCustomers();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCustomers]);

  return {
    // Data
    customers,
    isLoading,
    error,
    filters,
    
    // CRUD operations
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Query operations
    getCustomerById,
    getCustomerByEmail,
    searchCustomers,
    filterCustomers,
    
    // Special operations
    toggleVipStatus,
    toggleBlacklistStatus,
    addNote,
    getCustomerStats,
    
    // Filter operations
    updateFilters,
    clearFilters,
    
    // Utility
    refetch: () => fetchCustomers(),
  };
};

export default useCustomers;