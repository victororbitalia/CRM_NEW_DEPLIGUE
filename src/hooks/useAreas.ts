import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import apiClient from '@/lib/api';

export interface Area {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaData {
  restaurantId: string;
  name: string;
  description?: string;
  maxCapacity: number;
  isActive?: boolean;
}

export interface UpdateAreaData extends Partial<CreateAreaData> {
  id: string;
}

interface UseAreasOptions {
  restaurantId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useAreas = (options: UseAreasOptions | string = {}) => {
  // Permitir pasar el restaurantId directamente como string (compatibilidad hacia atrás)
  const opts = typeof options === 'string' ? { restaurantId: options } : options;
  const { restaurantId, autoRefresh = false, refreshInterval = 60000 } = opts;
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Obtener áreas
  const fetchAreas = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<any>(`/api/areas?restaurantId=${restaurantId}`);
      
      setAreas(response.data);
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al obtener las áreas';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, showError]);

  // Crear área
  const createArea = useCallback(async (areaData: CreateAreaData): Promise<Area | null> => {
    try {
      const response = await apiClient.post<any>('/api/areas', areaData);
      
      const newArea = response.data;
      setAreas(prev => [...prev, newArea]);
      showSuccess('Área creada correctamente');
      return newArea;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al crear el área';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Actualizar área
  const updateArea = useCallback(async (areaData: UpdateAreaData): Promise<Area | null> => {
    try {
      const { id, ...updateData } = areaData;
      
      const response = await apiClient.put<any>(`/api/areas/${id}`, updateData);
      
      const updatedArea = response.data;
      setAreas(prev => prev.map(area =>
        area.id === id ? updatedArea : area
      ));
      showSuccess('Área actualizada correctamente');
      return updatedArea;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al actualizar el área';
      showError(errorMessage);
      return null;
    }
  }, [showSuccess, showError]);

  // Eliminar área
  const deleteArea = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete<any>(`/api/areas/${id}`);
      
      setAreas(prev => prev.filter(area => area.id !== id));
      showSuccess('Área eliminada correctamente');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error de conexión al eliminar el área';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Obtener área por ID
  const getAreaById = useCallback((id: string): Area | null => {
    return areas.find(area => area.id === id) || null;
  }, [areas]);

  // Obtener capacidad total de todas las áreas
  const getTotalCapacity = useCallback((): number => {
    return areas.reduce((sum, area) => sum + area.maxCapacity, 0);
  }, [areas]);

  // Obtener áreas activas
  const getActiveAreas = useCallback((): Area[] => {
    return areas.filter(area => area.isActive);
  }, [areas]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchAreas();
  }, [restaurantId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !restaurantId) return;

    const interval = setInterval(fetchAreas, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, restaurantId]);

  return {
    // Datos
    areas,
    isLoading,
    error,
    
    // Métodos CRUD
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    
    // Métodos de consulta
    getAreaById,
    getTotalCapacity,
    getActiveAreas,
    
    // Utilidades
    refetch: fetchAreas,
  };
};

export default useAreas;