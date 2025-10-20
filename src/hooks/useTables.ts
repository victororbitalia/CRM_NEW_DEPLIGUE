import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import apiClient from '@/lib/api';

// Extender el tipo Table para incluir propiedades adicionales
export interface Table {
  id: string;
  areaId: string;
  number: string;
  capacity: number;
  minCapacity?: number;
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  height?: number | null;
  shape?: string | null;
  isAccessible?: boolean;
  isActive?: boolean;
  currentStatus?: string;
  currentReservation?: {
    id: string;
    customerName: string;
    startTime: string;
    endTime: string;
    partySize: number;
  };
  upcomingMaintenance?: {
    id: string;
    reason: string;
    scheduledStart: string;
    scheduledEnd: string;
  };
  area?: {
    id: string;
    name: string;
  };
}

export interface CreateTableData {
  areaId: string;
  number: string;
  capacity: number;
  minCapacity?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  shape?: string;
  isAccessible?: boolean;
  isActive?: boolean;
}

export interface UpdateTableData extends Partial<CreateTableData> {
  id: string;
}

interface UseTablesOptions {
  restaurantId: string;
  areaId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  // viewMode deshabilitado temporalmente
  // viewMode?: 'grid' | 'layout';
}

export const useTables = (options: UseTablesOptions) => {
  const { restaurantId, areaId, autoRefresh = true, refreshInterval = 30000 } = options;
  // viewMode deshabilitado temporalmente
  // const { restaurantId, areaId, autoRefresh = true, refreshInterval = 30000, viewMode = 'grid' } = options;
  
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Obtener mesas
  const fetchTables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('restaurantId', restaurantId);
      if (areaId) {
        params.append('areaId', areaId);
      }

      console.log('DEBUG: fetchTables called', { restaurantId, areaId });
      const response = await apiClient.get<any>(`/api/tables?${params}`);
      
      console.log('DEBUG: fetchTables response', response.data);
      setTables(response.data);
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al obtener las mesas';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, areaId, showError]);

  // Crear mesa
  const createTable = useCallback(async (tableData: CreateTableData): Promise<Table | null> => {
    try {
      const response = await apiClient.post<any>('/api/tables', tableData);
      
      const newTable = response.data;
      setTables(prev => [...prev, newTable]);
      showSuccess('Mesa creada correctamente');
      return newTable;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al crear la mesa';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Actualizar mesa
  const updateTable = useCallback(async (tableData: UpdateTableData): Promise<Table | null> => {
    try {
      const { id, ...updateData } = tableData;
      
      const response = await apiClient.put<any>(`/api/tables/${id}`, updateData);
      
      const updatedTable = response.data;
      setTables(prev => prev.map(table =>
        table.id === id ? updatedTable : table
      ));
      showSuccess('Mesa actualizada correctamente');
      return updatedTable;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al actualizar la mesa';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Eliminar mesa
  const deleteTable = useCallback(async (tableId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete<any>(`/api/tables/${tableId}`);
      
      setTables(prev => prev.filter(table => table.id !== tableId));
      showSuccess('Mesa eliminada correctamente');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al eliminar la mesa';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Actualizar posición de mesa
  const updateTablePosition = useCallback(async (tableId: string, positionX: number, positionY: number): Promise<boolean> => {
    try {
      console.log('DEBUG: updateTablePosition called', { tableId, positionX, positionY });
      const response = await apiClient.put<any>(`/api/tables/${tableId}`, { positionX, positionY });
      
      console.log('DEBUG: updateTablePosition response', response.data);
      
      // viewMode deshabilitado temporalmente - siempre actualizar el estado local
      // En modo layout, no actualizamos el estado local para evitar que las mesas vuelvan a su posición original
      // El estado local se maneja a través del hook useUnifiedTableLayout
      // if (viewMode === 'layout') {
      //   console.log('DEBUG: updateTablePosition - skipping local update in layout mode');
      // } else {
        setTables(prev => prev.map(table =>
          table.id === tableId
            ? { ...table, positionX, positionY }
            : table
        ));
      // }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al actualizar la posición de la mesa';
      showError(errorMessage);
      return false;
    }
  }, [showError]);

  // Cambiar estado de mesa
  const changeTableStatus = useCallback(async (tableId: string, status: string): Promise<boolean> => {
    try {
      const response = await apiClient.put<any>(`/api/tables/${tableId}`, { currentStatus: status });
      
      setTables(prev => prev.map(table =>
        table.id === tableId
          ? { ...table, currentStatus: status }
          : table
      ));
      showSuccess(`Estado de la mesa actualizado a ${status}`);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al actualizar el estado de la mesa';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Obtener mesa por ID
  const getTableById = useCallback((tableId: string): Table | null => {
    return tables.find(table => table.id === tableId) || null;
  }, [tables]);

  // Filtrar mesas por estado
  const getTablesByStatus = useCallback((status: string): Table[] => {
    return tables.filter(table => table.currentStatus === status);
  }, [tables]);

  // Filtrar mesas por área
  const getTablesByArea = useCallback((areaId: string): Table[] => {
    return tables.filter(table => table.areaId === areaId);
  }, [tables]);

  // Obtener estadísticas de mesas
  const getTableStats = useCallback(() => {
    const stats = {
      total: tables.length,
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      totalCapacity: 0,
    };

    tables.forEach(table => {
      switch (table.currentStatus) {
        case 'available':
          stats.available++;
          break;
        case 'occupied':
          stats.occupied++;
          break;
        case 'reserved':
          stats.reserved++;
          break;
        case 'maintenance':
          stats.maintenance++;
          break;
      }
      stats.totalCapacity += table.capacity;
    });

    return stats;
  }, [tables]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchTables();
  }, [restaurantId, areaId]);

  // Auto-refresh (viewMode deshabilitado temporalmente)
  useEffect(() => {
    if (!autoRefresh) return;
    // if (!autoRefresh || viewMode === 'layout') return;

    const interval = setInterval(fetchTables, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, restaurantId, areaId]);

  return {
    // Datos
    tables,
    isLoading,
    error,
    
    // Métodos CRUD
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    
    // Métodos especializados
    updateTablePosition,
    changeTableStatus,
    
    // Métodos de consulta
    getTableById,
    getTablesByStatus,
    getTablesByArea,
    getTableStats,
    
    // Utilidades
    refetch: fetchTables,
  };
};

export default useTables;