import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from './useNotifications';

export interface MaintenanceRecord {
  id: string;
  tableId: string;
  reason: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  table?: {
    id: string;
    number: string;
    capacity: number;
    area?: {
      id: string;
      name: string;
    };
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateMaintenanceData {
  tableId: string;
  reason: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes?: string;
}

export interface UpdateMaintenanceData extends Partial<CreateMaintenanceData> {
  id: string;
  actualStart?: string;
  actualEnd?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface UseMaintenanceOptions {
  restaurantId?: string;
  tableId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useMaintenance = (options: UseMaintenanceOptions = {}) => {
  const {
    restaurantId,
    tableId,
    status,
    startDate,
    endDate,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Helper function to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Obtener registros de mantenimiento
  const fetchMaintenanceRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (restaurantId) params.append('restaurantId', restaurantId);
      if (tableId) params.append('tableId', tableId);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/tables/maintenance?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setMaintenanceRecords(data.data);
      } else {
        setError(data.error || 'Error al obtener registros de mantenimiento');
        showError(data.error || 'Error al obtener registros de mantenimiento');
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al obtener registros de mantenimiento';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, tableId, status, startDate, endDate, showError]);

  // Crear registro de mantenimiento
  const createMaintenanceRecord = useCallback(async (data: CreateMaintenanceData): Promise<MaintenanceRecord | null> => {
    try {
      const response = await fetch('/api/tables/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        const newRecord = result.data;
        setMaintenanceRecords(prev => [...prev, newRecord]);
        showSuccess('Mantenimiento programado correctamente');
        return newRecord;
      } else {
        showError(result.error || 'Error al programar mantenimiento');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al programar mantenimiento';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Actualizar registro de mantenimiento
  const updateMaintenanceRecord = useCallback(async (data: UpdateMaintenanceData): Promise<MaintenanceRecord | null> => {
    try {
      const { id, ...updateData } = data;
      
      const response = await fetch(`/api/tables/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        const updatedRecord = result.data;
        setMaintenanceRecords(prev => prev.map(record => 
          record.id === id ? updatedRecord : record
        ));
        showSuccess('Registro de mantenimiento actualizado correctamente');
        return updatedRecord;
      } else {
        showError(result.error || 'Error al actualizar registro de mantenimiento');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al actualizar registro de mantenimiento';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Eliminar registro de mantenimiento
  const deleteMaintenanceRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tables/maintenance/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
        showSuccess('Registro de mantenimiento eliminado correctamente');
        return true;
      } else {
        showError(result.error || 'Error al eliminar registro de mantenimiento');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al eliminar registro de mantenimiento';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Iniciar mantenimiento
  const startMaintenance = useCallback(async (id: string): Promise<boolean> => {
    return updateMaintenanceRecord({
      id,
      status: 'in_progress',
      actualStart: new Date().toISOString(),
    }) !== null;
  }, [updateMaintenanceRecord]);

  // Completar mantenimiento
  const completeMaintenance = useCallback(async (id: string): Promise<boolean> => {
    return updateMaintenanceRecord({
      id,
      status: 'completed',
      actualEnd: new Date().toISOString(),
    }) !== null;
  }, [updateMaintenanceRecord]);

  // Cancelar mantenimiento
  const cancelMaintenance = useCallback(async (id: string): Promise<boolean> => {
    return updateMaintenanceRecord({
      id,
      status: 'cancelled',
    }) !== null;
  }, [updateMaintenanceRecord]);

  // Obtener registro por ID
  const getMaintenanceById = useCallback((id: string): MaintenanceRecord | null => {
    return maintenanceRecords.find(record => record.id === id) || null;
  }, [maintenanceRecords]);

  // Filtrar registros por estado
  const getMaintenanceByStatus = useCallback((status: string): MaintenanceRecord[] => {
    return maintenanceRecords.filter(record => record.status === status);
  }, [maintenanceRecords]);

  // Filtrar registros por mesa
  const getMaintenanceByTable = useCallback((tableId: string): MaintenanceRecord[] => {
    return maintenanceRecords.filter(record => record.tableId === tableId);
  }, [maintenanceRecords]);

  // Obtener mantenimientos activos
  const getActiveMaintenance = useCallback((): MaintenanceRecord[] => {
    return maintenanceRecords.filter(record => 
      record.status === 'scheduled' || record.status === 'in_progress'
    );
  }, [maintenanceRecords]);

  // Obtener mantenimientos próximos (próximos 7 días)
  const getUpcomingMaintenance = useCallback((): MaintenanceRecord[] => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return maintenanceRecords.filter(record => {
      if (record.status !== 'scheduled') return false;
      
      const startDate = new Date(record.scheduledStart);
      return startDate >= now && startDate <= nextWeek;
    });
  }, [maintenanceRecords]);

  // Verificar si una mesa tiene mantenimiento programado
  const hasScheduledMaintenance = useCallback((tableId: string, startTime?: string, endTime?: string): boolean => {
    const tableMaintenance = getMaintenanceByTable(tableId);
    
    if (tableMaintenance.length === 0) return false;
    
    return tableMaintenance.some(record => {
      if (record.status !== 'scheduled') return false;
      
      if (!startTime || !endTime) return true;
      
      const maintenanceStart = new Date(record.scheduledStart);
      const maintenanceEnd = new Date(record.scheduledEnd);
      const reservationStart = new Date(startTime);
      const reservationEnd = new Date(endTime);
      
      return (
        (maintenanceStart <= reservationStart && maintenanceEnd > reservationStart) ||
        (maintenanceStart < reservationEnd && maintenanceEnd >= reservationEnd) ||
        (maintenanceStart >= reservationStart && maintenanceEnd <= reservationEnd)
      );
    });
  }, [getMaintenanceByTable]);

  // Obtener estadísticas de mantenimiento
  const getMaintenanceStats = useCallback(() => {
    const stats = {
      total: maintenanceRecords.length,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      upcoming: 0,
    };

    maintenanceRecords.forEach(record => {
      switch (record.status) {
        case 'scheduled':
          stats.scheduled++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    stats.upcoming = getUpcomingMaintenance().length;

    return stats;
  }, [maintenanceRecords, getUpcomingMaintenance]);

  // Obtener historial de mantenimiento por mesa
  const getMaintenanceHistoryByTable = useCallback((tableId: string): MaintenanceRecord[] => {
    return getMaintenanceByTable(tableId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getMaintenanceByTable]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchMaintenanceRecords();
  }, [fetchMaintenanceRecords]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMaintenanceRecords, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMaintenanceRecords]);

  return {
    // Datos
    maintenanceRecords,
    isLoading,
    error,
    
    // Métodos CRUD
    fetchMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    
    // Métodos de flujo de trabajo
    startMaintenance,
    completeMaintenance,
    cancelMaintenance,
    
    // Métodos de consulta
    getMaintenanceById,
    getMaintenanceByStatus,
    getMaintenanceByTable,
    getActiveMaintenance,
    getUpcomingMaintenance,
    hasScheduledMaintenance,
    getMaintenanceHistoryByTable,
    
    // Utilidades
    getMaintenanceStats,
    refetch: fetchMaintenanceRecords,
  };
};

export default useMaintenance;