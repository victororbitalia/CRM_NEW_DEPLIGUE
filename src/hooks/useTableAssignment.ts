import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface AssignmentRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  duration?: number;
  areaId?: string;
  isAccessible?: boolean;
  preferences?: {
    areaId?: string;
    shape?: string;
    location?: string;
  };
}

export interface AssignmentTable {
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
  area?: {
    id: string;
    name: string;
  };
}

export interface AssignmentScore {
  capacityFit: number;
  areaMatch: number;
  shapeMatch: number;
  locationMatch: number;
  accessibility: number;
}

export interface AssignmentResult {
  assigned: boolean;
  table?: AssignmentTable;
  score?: number;
  reasons?: AssignmentScore;
  alternatives?: AssignmentTable[];
  reason?: string;
  suggestions?: Array<{
    time: string;
    available: boolean;
    tablesCount: number;
  }>;
  reservationDetails?: {
    date: string;
    time: string;
    partySize: number;
    duration: number;
    startTime: string;
    endTime: string;
  };
}

interface UseTableAssignmentOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTableAssignment = (options: UseTableAssignmentOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  const [assignment, setAssignment] = useState<AssignmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Realizar asignación automática
  const assignTable = useCallback(async (request: AssignmentRequest): Promise<AssignmentResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tables/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        setAssignment(result);
        
        if (result.assigned) {
          showSuccess(`Mesa ${result.table?.number} asignada correctamente`);
        } else {
          showError(result.reason || 'No hay mesas disponibles');
        }
        
        return result;
      } else {
        setError(data.error || 'Error al realizar asignación');
        showError(data.error || 'Error al realizar asignación');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al realizar asignación';
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showSuccess, showError]);

  // Asignar mesa específica
  const assignSpecificTable = useCallback(async (
    tableId: string,
    request: Omit<AssignmentRequest, 'preferences'>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tables/${tableId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Mesa asignada correctamente`);
        return true;
      } else {
        showError(data.error || 'Error al asignar mesa');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al asignar mesa';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Liberar mesa asignada
  const releaseTable = useCallback(async (tableId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tables/${tableId}/release`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Mesa liberada correctamente`);
        return true;
      } else {
        showError(data.error || 'Error al liberar mesa');
        return false;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al liberar mesa';
      showError(errorMessage);
      return false;
    }
  }, [showSuccess, showError]);

  // Obtener mejores opciones de asignación
  const getBestAssignmentOptions = useCallback(async (
    request: AssignmentRequest,
    maxOptions: number = 5
  ): Promise<AssignmentTable[]> => {
    try {
      const response = await fetch('/api/tables/best-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...request, maxOptions }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.tables;
      } else {
        showError(data.error || 'Error al obtener opciones de asignación');
        return [];
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al obtener opciones';
      showError(errorMessage);
      return [];
    }
  }, [showError]);

  // Verificar si una mesa es adecuada para una reserva
  const isTableSuitable = useCallback((
    table: AssignmentTable,
    partySize: number,
    preferences?: AssignmentRequest['preferences']
  ): boolean => {
    // Verificar capacidad
    if (partySize < (table.minCapacity || 1) || partySize > table.capacity) {
      return false;
    }

    // Verificar accesibilidad
    if (preferences?.isAccessible && !(table.isAccessible || false)) {
      return false;
    }

    // Verificar área preferida
    if (preferences?.areaId && table.areaId !== preferences.areaId) {
      return false;
    }

    // Verificar forma preferida
    if (preferences?.shape && table.shape !== preferences.shape) {
      return false;
    }

    return true;
  }, []);

  // Calcular puntuación de adecuación para una mesa
  const calculateTableScore = useCallback((
    table: AssignmentTable,
    partySize: number,
    preferences?: AssignmentRequest['preferences']
  ): AssignmentScore => {
    // Puntuación por ajuste de capacidad (preferir mesas más ajustadas)
    const capacityFit = 1 - (table.capacity - partySize) / table.capacity;
    
    // Puntuación por área
    const areaMatch = preferences?.areaId && table.areaId === preferences.areaId ? 1 : 0;
    
    // Puntuación por forma
    const shapeMatch = preferences?.shape && table.shape === preferences.shape ? 1 : 0;
    
    // Puntuación por ubicación
    const locationMatch = preferences?.location && 
      table.area?.name.toLowerCase().includes(preferences.location.toLowerCase()) ? 1 : 0;
    
    // Puntuación por accesibilidad
    const accessibility = preferences?.isAccessible && (table.isAccessible || false) ? 1 :
                         (preferences?.isAccessible && !(table.isAccessible || false) ? 0 : 0.5);
    
    return {
      capacityFit: Math.round(capacityFit * 100),
      areaMatch: Math.round(areaMatch * 100),
      shapeMatch: Math.round(shapeMatch * 100),
      locationMatch: Math.round(locationMatch * 100),
      accessibility: Math.round(accessibility * 100),
    };
  }, []);

  // Obtener mesas alternativas si la asignación falla
  const getAlternativeTables = useCallback(async (
    request: AssignmentRequest,
    excludeTableId?: string
  ): Promise<AssignmentTable[]> => {
    try {
      const response = await fetch('/api/tables/alternatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...request, 
          excludeTableId,
          maxResults: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.tables;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error al obtener mesas alternativas:', err);
      return [];
    }
  }, []);

  // Suggester cambios de horario si no hay disponibilidad
  const suggestTimeChanges = useCallback(async (
    request: AssignmentRequest,
    windowMinutes: number = 60
  ): Promise<Array<{ time: string; available: boolean; tablesCount: number }>> => {
    try {
      const response = await fetch('/api/tables/time-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...request, 
          windowMinutes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.suggestions;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error al obtener sugerencias de horario:', err);
      return [];
    }
  }, []);

  // Optimizar asignación para múltiples mesas (grupos grandes)
  const optimizeLargeGroupAssignment = useCallback(async (
    request: AssignmentRequest
  ): Promise<AssignmentTable[][]> => {
    try {
      const response = await fetch('/api/tables/optimize-large-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.combinations;
      } else {
        showError(data.error || 'Error al optimizar asignación para grupo grande');
        return [];
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al optimizar asignación';
      showError(errorMessage);
      return [];
    }
  }, [showError]);

  // Simular asignación (sin guardar en BD)
  const simulateAssignment = useCallback(async (
    request: AssignmentRequest
  ): Promise<AssignmentResult | null> => {
    try {
      const response = await fetch('/api/tables/simulate-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        return null;
      }
    } catch (err) {
      console.error('Error al simular asignación:', err);
      return null;
    }
  }, []);

  // Limpiar estado
  const clearAssignment = useCallback(() => {
    setAssignment(null);
    setError(null);
  }, []);

  return {
    // Estado
    assignment,
    isLoading,
    error,
    
    // Métodos principales
    assignTable,
    assignSpecificTable,
    releaseTable,
    
    // Métodos de consulta
    getBestAssignmentOptions,
    getAlternativeTables,
    suggestTimeChanges,
    
    // Métodos de optimización
    optimizeLargeGroupAssignment,
    simulateAssignment,
    
    // Métodos de análisis
    isTableSuitable,
    calculateTableScore,
    
    // Utilidades
    clearAssignment,
  };
};

export default useTableAssignment;