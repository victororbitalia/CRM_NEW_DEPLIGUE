import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string;
  tableName?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  occasion?: string;
  notes?: string;
  source?: string;
  depositAmount?: number;
  depositPaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface CreateReservationData {
  customerId: string;
  date: Date;
  startTime: string;
  endTime?: string;
  partySize: number;
  tableId?: string;
  areaId?: string;
  specialRequests?: string;
  occasion?: string;
  notes?: string;
  source?: string;
  depositAmount?: number;
}

export interface UpdateReservationData extends Partial<CreateReservationData> {
  id: string;
  status?: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  cancellationReason?: string;
}

export interface ReservationFilters {
  date?: Date;
  status?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface UseReservationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: ReservationFilters;
}

export const useReservations = (options: UseReservationsOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 30000, initialFilters = {} } = options;
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReservationFilters>(initialFilters);
  const { showSuccess, showError } = useNotifications();
  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  // Fetch reservations
  const fetchReservations = useCallback(async (customFilters?: ReservationFilters) => {
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
      
      if (activeFilters.startDate) {
        params.append('startDate', activeFilters.startDate.toISOString());
      }
      
      if (activeFilters.endDate) {
        params.append('endDate', activeFilters.endDate.toISOString());
      }
      
      if (activeFilters.search) {
        params.append('search', activeFilters.search);
      }

      const response = await fetch(`/api/reservations?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Transform the data to match the expected format
        const processedReservations = data.data.map((reservation: any) => {
          // Extract customer data
          const customer = reservation.customer || {};
          const table = reservation.table || {};
          
          // Format dates and times
          const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          };
          
          const formatTime = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            });
          };
          
          return {
            ...reservation,
            // Customer data
            customerName: customer.firstName && customer.lastName
              ? `${customer.firstName} ${customer.lastName}`
              : 'Cliente sin nombre',
            customerEmail: customer.email || '',
            customerPhone: customer.phone || '',
            
            // Table data
            tableName: table.name || 'No asignada',
            
            // Date and time formatting
            date: new Date(reservation.date),
            startTime: formatTime(reservation.startTime),
            endTime: formatTime(reservation.endTime),
            
            // Other dates
            createdAt: new Date(reservation.createdAt),
            updatedAt: new Date(reservation.updatedAt),
            confirmedAt: reservation.confirmedAt ? new Date(reservation.confirmedAt) : undefined,
            seatedAt: reservation.seatedAt ? new Date(reservation.seatedAt) : undefined,
            completedAt: reservation.completedAt ? new Date(reservation.completedAt) : undefined,
            cancelledAt: reservation.cancelledAt ? new Date(reservation.cancelledAt) : undefined,
          };
        });
        
        setReservations(processedReservations);
      } else {
        setError(data.error || 'Failed to fetch reservations');
        showError(data.error || 'Failed to fetch reservations');
      }
    } catch (err) {
      const errorMessage = 'Connection error while fetching reservations';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, showError]);

  // Create reservation
  const createReservation = useCallback(async (reservationData: CreateReservationData): Promise<Reservation | null> => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (data.success) {
        // Extract customer data
        const customer = data.data.customer || {};
        const table = data.data.table || {};
        
        // Format dates and times
        const formatTime = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        
        const newReservation = {
          ...data.data,
          // Customer data
          customerName: customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : 'Cliente sin nombre',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          
          // Table data
          tableName: table.name || 'No asignada',
          
          // Date and time formatting
          date: new Date(data.data.date),
          startTime: formatTime(data.data.startTime),
          endTime: formatTime(data.data.endTime),
          
          // Other dates
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
          confirmedAt: data.data.confirmedAt ? new Date(data.data.confirmedAt) : undefined,
          seatedAt: data.data.seatedAt ? new Date(data.data.seatedAt) : undefined,
          completedAt: data.data.completedAt ? new Date(data.data.completedAt) : undefined,
          cancelledAt: data.data.cancelledAt ? new Date(data.data.cancelledAt) : undefined,
        };
        
        setReservations(prev => [...prev, newReservation]);
        showSuccess('Reservation created successfully');
        return newReservation;
      } else {
        showError(data.error || 'Failed to create reservation');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while creating reservation';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Update reservation
  const updateReservation = useCallback(async (reservationData: UpdateReservationData): Promise<Reservation | null> => {
    try {
      const { id, ...updateData } = reservationData;
      
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        // Extract customer data
        const customer = data.data.customer || {};
        const table = data.data.table || {};
        
        // Format dates and times
        const formatTime = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        
        const updatedReservation = {
          ...data.data,
          // Customer data
          customerName: customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : 'Cliente sin nombre',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          
          // Table data
          tableName: table.name || 'No asignada',
          
          // Date and time formatting
          date: new Date(data.data.date),
          startTime: formatTime(data.data.startTime),
          endTime: formatTime(data.data.endTime),
          
          // Other dates
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
          confirmedAt: data.data.confirmedAt ? new Date(data.data.confirmedAt) : undefined,
          seatedAt: data.data.seatedAt ? new Date(data.data.seatedAt) : undefined,
          completedAt: data.data.completedAt ? new Date(data.data.completedAt) : undefined,
          cancelledAt: data.data.cancelledAt ? new Date(data.data.cancelledAt) : undefined,
        };
        
        setReservations(prev => prev.map(reservation =>
          reservation.id === id ? updatedReservation : reservation
        ));
        
        showSuccess('Reservation updated successfully');
        return updatedReservation;
      } else {
        showError(data.error || 'Failed to update reservation');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Connection error while updating reservation';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Delete reservation
  const deleteReservation = useCallback(async (reservationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
        showSuccess('Reservation deleted successfully');
        return true;
      } else {
        showError(data.error || 'Failed to delete reservation');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Connection error while deleting reservation';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Update reservation status
  const updateReservationStatus = useCallback(async (
    reservationId: string, 
    status: string, 
    reason?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          status,
          ...(reason && { cancellationReason: reason })
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Extract customer data
        const customer = data.data.customer || {};
        const table = data.data.table || {};
        
        // Format dates and times
        const formatTime = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        
        const updatedReservation = {
          ...data.data,
          // Customer data
          customerName: customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : 'Cliente sin nombre',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          
          // Table data
          tableName: table.name || 'No asignada',
          
          // Date and time formatting
          date: new Date(data.data.date),
          startTime: formatTime(data.data.startTime),
          endTime: formatTime(data.data.endTime),
          
          // Other dates
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
          confirmedAt: data.data.confirmedAt ? new Date(data.data.confirmedAt) : undefined,
          seatedAt: data.data.seatedAt ? new Date(data.data.seatedAt) : undefined,
          completedAt: data.data.completedAt ? new Date(data.data.completedAt) : undefined,
          cancelledAt: data.data.cancelledAt ? new Date(data.data.cancelledAt) : undefined,
        };
        
        setReservations(prev => prev.map(reservation =>
          reservation.id === reservationId ? updatedReservation : reservation
        ));
        
        showSuccess('Reservation status updated successfully');
        return true;
      } else {
        showError(data.error || 'Failed to update reservation status');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Connection error while updating reservation status';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Get reservation by ID
  const getReservationById = useCallback((reservationId: string): Reservation | null => {
    return reservations.find(reservation => reservation.id === reservationId) || null;
  }, [reservations]);

  // Filter reservations
  const filterReservations = useCallback((customFilters: ReservationFilters): Reservation[] => {
    let filtered = [...reservations];

    if (customFilters.date) {
      const filterDate = new Date(customFilters.date);
      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.toDateString() === filterDate.toDateString();
      });
    }

    if (customFilters.status) {
      filtered = filtered.filter(reservation => reservation.status === customFilters.status);
    }

    if (customFilters.customerId) {
      filtered = filtered.filter(reservation => reservation.customerId === customFilters.customerId);
    }

    if (customFilters.startDate && customFilters.endDate) {
      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate >= customFilters.startDate! && reservationDate <= customFilters.endDate!;
      });
    }

    if (customFilters.search) {
      const searchTerm = customFilters.search.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.customerName.toLowerCase().includes(searchTerm) ||
        reservation.customerEmail.toLowerCase().includes(searchTerm) ||
        reservation.customerPhone.includes(searchTerm) ||
        (reservation.specialRequests && reservation.specialRequests.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }, [reservations]);

  // Get reservation statistics
  const getReservationStats = useCallback(() => {
    const stats = {
      total: reservations.length,
      pending: 0,
      confirmed: 0,
      seated: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      today: 0,
      upcoming: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    reservations.forEach(reservation => {
      // Status counts
      switch (reservation.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'confirmed':
          stats.confirmed++;
          break;
        case 'seated':
          stats.seated++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'no_show':
          stats.noShow++;
          break;
      }

      // Date-based counts
      const reservationDate = new Date(reservation.date);
      if (reservationDate >= today && reservationDate < tomorrow) {
        stats.today++;
      }

      if (reservationDate >= today && ['pending', 'confirmed'].includes(reservation.status)) {
        stats.upcoming++;
      }
    });

    return stats;
  }, [reservations]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ReservationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Load initial data
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchReservations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchReservations]);

  return {
    // Data
    reservations,
    isLoading,
    error,
    filters,
    
    // CRUD operations
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus,
    
    // Query operations
    getReservationById,
    filterReservations,
    getReservationStats,
    
    // Filter operations
    updateFilters,
    clearFilters,
    
    // Utility
    refetch: () => fetchReservations(),
  };
};

export default useReservations;