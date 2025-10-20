import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface AvailabilityRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  duration?: number;
  areaId?: string;
}

export interface AvailableTable {
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

export interface AreaAvailability {
  area: {
    id: string;
    name: string;
    description?: string;
  };
  tables: AvailableTable[];
  availableCount: number;
  totalCapacity: number;
}

export interface AvailabilityResponse {
  date: string;
  time: string;
  partySize: number;
  duration: number;
  startTime: string;
  endTime: string;
  areaAvailability: AreaAvailability[];
  availableTables: AvailableTable[];
  stats: {
    totalAvailable: number;
    totalTables: number;
    totalCapacity: number;
    areasAvailable: number;
  };
}

export interface AlternativeTime {
  time: string;
  available: boolean;
  tablesCount: number;
}

interface UseTableAvailabilityOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTableAvailability = (options: UseTableAvailabilityOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotifications();

  // Consultar disponibilidad
  const checkAvailability = useCallback(async (request: AvailabilityRequest): Promise<AvailabilityResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tables/availability', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setAvailability(data.data);
        return data.data;
      } else {
        setError(data.error || 'Error al consultar disponibilidad');
        showError(data.error || 'Error al consultar disponibilidad');
        return null;
      }
    } catch (err) {
      const errorMessage = 'Error de conexión al consultar disponibilidad';
      setError(errorMessage);
      showError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Consultar disponibilidad para un rango de fechas
  const checkAvailabilityRange = useCallback(async (
    restaurantId: string,
    startDate: string,
    endDate: string,
    time: string,
    partySize: number,
    duration?: number
  ): Promise<Record<string, AvailabilityResponse | null>> => {
    const results: Record<string, AvailabilityResponse | null> = {};
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const availability = await checkAvailability({
        restaurantId,
        date: dateStr,
        time,
        partySize,
        duration,
      });
      results[dateStr] = availability;
    }
    
    return results;
  }, [checkAvailability]);

  // Obtener alternativas de horario
  const getTimeAlternatives = useCallback(async (
    restaurantId: string,
    date: string,
    time: string,
    partySize: number,
    duration = 120,
    windowMinutes = 120
  ): Promise<AlternativeTime[]> => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const baseTime = new Date();
      baseTime.setHours(hours, minutes, 0, 0);
      
      const alternatives: AlternativeTime[] = [];
      const startWindow = new Date(baseTime.getTime() - windowMinutes * 60000);
      const endWindow = new Date(baseTime.getTime() + windowMinutes * 60000);
      
      // Verificar cada 30 minutos en la ventana
      for (let currentTime = new Date(startWindow); currentTime <= endWindow; currentTime.setMinutes(currentTime.getMinutes() + 30)) {
        const timeStr = currentTime.toTimeString().slice(0, 5);
        
        // Omitir el horario original
        if (timeStr === time) continue;
        
        const response = await checkAvailability({
          restaurantId,
          date,
          time: timeStr,
          partySize,
          duration,
        });
        
        alternatives.push({
          time: timeStr,
          available: response ? response.stats.totalAvailable > 0 : false,
          tablesCount: response ? response.stats.totalAvailable : 0,
        });
      }
      
      return alternatives.sort((a, b) => {
        // Ordenar por disponibilidad primero, luego por cercanía al horario original
        if (a.available !== b.available) {
          return a.available ? -1 : 1;
        }
        
        const aTime = new Date();
        const bTime = new Date();
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        const [origHours, origMinutes] = time.split(':').map(Number);
        
        aTime.setHours(aHours, aMinutes, 0, 0);
        bTime.setHours(bHours, bMinutes, 0, 0);
        const origTime = new Date();
        origTime.setHours(origHours, origMinutes, 0, 0);
        
        const aDiff = Math.abs(aTime.getTime() - origTime.getTime());
        const bDiff = Math.abs(bTime.getTime() - origTime.getTime());
        
        return aDiff - bDiff;
      });
    } catch (err) {
      console.error('Error al obtener alternativas de horario:', err);
      return [];
    }
  }, [checkAvailability]);

  // Obtener mejores horas para una fecha
  const getBestTimes = useCallback(async (
    restaurantId: string,
    date: string,
    partySize: number,
    duration = 120,
    startTime = '18:00',
    endTime = '23:00'
  ): Promise<AlternativeTime[]> => {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startDateTime = new Date();
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date();
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      const timeSlots: AlternativeTime[] = [];
      
      // Verificar cada 30 minutos en el rango
      for (let currentTime = new Date(startDateTime); currentTime <= endDateTime; currentTime.setMinutes(currentTime.getMinutes() + 30)) {
        const timeStr = currentTime.toTimeString().slice(0, 5);
        
        const response = await checkAvailability({
          restaurantId,
          date,
          time: timeStr,
          partySize,
          duration,
        });
        
        if (response && response.stats.totalAvailable > 0) {
          timeSlots.push({
            time: timeStr,
            available: true,
            tablesCount: response.stats.totalAvailable,
          });
        }
      }
      
      // Ordenar por número de mesas disponibles (descendente)
      return timeSlots.sort((a, b) => b.tablesCount - a.tablesCount);
    } catch (err) {
      console.error('Error al obtener mejores horarios:', err);
      return [];
    }
  }, [checkAvailability]);

  // Verificar disponibilidad para una mesa específica
  const checkTableAvailability = useCallback(async (
    tableId: string,
    date: string,
    time: string,
    duration = 120
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tables/${tableId}/availability`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          time,
          duration,
        }),
      });

      const data = await response.json();
      return data.success ? data.data.available : false;
    } catch (err) {
      console.error('Error al verificar disponibilidad de mesa:', err);
      return false;
    }
  }, []);

  // Obtener mesas disponibles por área
  const getAvailableTablesByArea = useCallback((areaId: string): AvailableTable[] => {
    if (!availability) return [];
    
    const areaAvailability = availability.areaAvailability.find(area => area.area.id === areaId);
    return areaAvailability ? areaAvailability.tables : [];
  }, [availability]);

  // Obtener capacidad total disponible
  const getTotalAvailableCapacity = useCallback((): number => {
    if (!availability) return 0;
    return availability.stats.totalCapacity;
  }, [availability]);

  // Verificar si hay suficientes mesas para un grupo grande
  const canAccommodateLargeGroup = useCallback((partySize: number): boolean => {
    if (!availability) return false;
    
    // Buscar mesas individuales que puedan acomodar al grupo
    const hasIndividualTable = availability.availableTables.some(table => table.capacity >= partySize);
    if (hasIndividualTable) return true;
    
    // Calcular capacidad total combinada
    const totalCapacity = availability.availableTables.reduce((sum, table) => sum + table.capacity, 0);
    return totalCapacity >= partySize;
  }, [availability]);

  // Obtener sugerencias de mesas para un grupo grande
  const getTableSuggestionsForLargeGroup = useCallback((partySize: number): AvailableTable[][] => {
    if (!availability) return [];
    
    const tables = availability.availableTables.sort((a, b) => b.capacity - a.capacity);
    const suggestions: AvailableTable[][] = [];
    
    // Buscar combinaciones de mesas
    for (let i = 0; i < tables.length; i++) {
      const combination = [tables[i]];
      let currentCapacity = tables[i].capacity;
      
      if (currentCapacity >= partySize) {
        suggestions.push(combination);
        continue;
      }
      
      // Intentar añadir más mesas
      for (let j = i + 1; j < tables.length; j++) {
        combination.push(tables[j]);
        currentCapacity += tables[j].capacity;
        
        if (currentCapacity >= partySize) {
          suggestions.push([...combination]);
          break;
        }
      }
    }
    
    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }, [availability]);

  // Limpiar estado
  const clearAvailability = useCallback(() => {
    setAvailability(null);
    setError(null);
  }, []);

  return {
    // Estado
    availability,
    isLoading,
    error,
    
    // Métodos principales
    checkAvailability,
    checkAvailabilityRange,
    
    // Métodos de consulta
    getTimeAlternatives,
    getBestTimes,
    checkTableAvailability,
    
    // Métodos de análisis
    getAvailableTablesByArea,
    getTotalAvailableCapacity,
    canAccommodateLargeGroup,
    getTableSuggestionsForLargeGroup,
    
    // Utilidades
    clearAvailability,
  };
};

export default useTableAvailability;