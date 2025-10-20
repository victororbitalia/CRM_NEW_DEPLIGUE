// Algoritmos de asignación automática de mesas
export class TableAssignmentAlgorithm {
  /**
   * Asigna automáticamente la mejor mesa para una reserva
   */
  static assignBestTable(
    tables: any[],
    partySize: number,
    preferences: any = {},
    reservations: any[] = [],
    maintenanceRecords: any[] = []
  ) {
    // Filtrar mesas disponibles
    const availableTables = this.filterAvailableTables(
      tables,
      partySize,
      reservations,
      maintenanceRecords
    );

    if (availableTables.length === 0) {
      return { assigned: false, reason: 'No hay mesas disponibles' };
    }

    // Calcular puntuación para cada mesa
    const scoredTables = availableTables.map(table => ({
      table,
      score: this.calculateTableScore(table, partySize, preferences),
    }));

    // Ordenar por puntuación y seleccionar la mejor
    scoredTables.sort((a, b) => b.score - a.score);
    const bestMatch = scoredTables[0];

    // Obtener alternativas
    const alternatives = scoredTables.slice(1, 3).map(item => item.table);

    return {
      assigned: true,
      table: bestMatch.table,
      score: bestMatch.score,
      alternatives,
    };
  }

  /**
   * Filtra mesas disponibles según criterios
   */
  static filterAvailableTables(
    tables: any[],
    partySize: number,
    reservations: any[] = [],
    maintenanceRecords: any[] = []
  ) {
    const now = new Date();

    return tables.filter(table => {
      // Verificar capacidad
      if (partySize < (table.minCapacity || 1) || partySize > table.capacity) {
        return false;
      }

      // Verificar si está en mantenimiento
      const hasMaintenance = maintenanceRecords.some(maintenance => {
        const maintenanceStart = new Date(maintenance.scheduledStart);
        const maintenanceEnd = new Date(maintenance.scheduledEnd);
        
        return (
          (maintenance.status === 'in_progress') ||
          (maintenance.status === 'scheduled' && 
           maintenanceStart <= now && 
           maintenanceEnd >= now)
        );
      });

      if (hasMaintenance) return false;

      // Verificar si tiene reservas conflictivas
      const hasConflictingReservation = reservations.some(reservation => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);
        
        return (
          (reservationStart <= now && reservationEnd >= now) ||
          (reservationStart <= now && reservationEnd >= now)
        );
      });

      return !hasConflictingReservation;
    });
  }

  /**
   * Calcula la puntuación de una mesa según preferencias
   */
  static calculateTableScore(table: any, partySize: number, preferences: any = {}) {
    let score = 0;
    
    // Puntuación por ajuste de capacidad (preferir mesas más ajustadas)
    const capacityFit = 1 - (table.capacity - partySize) / table.capacity;
    score += capacityFit * 40; // 40% del peso
    
    // Puntuación por área preferida
    if (preferences.areaId && table.areaId === preferences.areaId) {
      score += 30; // 30% del peso si coincide con el área preferida
    }
    
    // Puntuación por forma preferida
    if (preferences.shape && table.shape === preferences.shape) {
      score += 10; // 10% del peso si coincide con la forma preferida
    }
    
    // Puntuación por ubicación preferida
    if (preferences.location && table.area?.name?.toLowerCase().includes(preferences.location.toLowerCase())) {
      score += 10; // 10% del peso si coincide con la ubicación preferida
    }
    
    // Puntuación por accesibilidad
    if (preferences.isAccessible && table.isAccessible) {
      score += 10; // 10% del peso si se necesita accesibilidad y la mesa la tiene
    }
    
    return score;
  }

  /**
   * Optimiza la distribución de mesas para grupos grandes
   */
  static optimizeForLargeGroup(
    tables: any[],
    partySize: number,
    maxTables: number = 3
  ): any[][] {
    const availableTables = this.filterAvailableTables(tables, partySize);
    const combinations: any[][] = [];

    // Buscar combinaciones de mesas
    this.findTableCombinations(
      availableTables,
      partySize,
      [],
      combinations,
      maxTables
    );

    // Ordenar combinaciones por número de mesas (menos es mejor)
    combinations.sort((a, b) => a.length - b.length);

    return combinations.slice(0, 3); // Máximo 3 combinaciones
  }

  /**
   * Encuentra combinaciones de mesas recursivamente
   */
  private static findTableCombinations(
    tables: any[],
    remainingPartySize: number,
    currentCombination: any[],
    combinations: any[][],
    maxTables: number,
    startIndex: number = 0
  ) {
    // Si ya tenemos una combinación válida, añadirla
    if (remainingPartySize <= 0 && currentCombination.length > 0) {
      combinations.push([...currentCombination]);
      return;
    }

    // Si excedemos el número máximo de mesas, detener
    if (currentCombination.length >= maxTables) {
      return;
    }

    // Buscar mesas que puedan acomodar parte del grupo
    for (let i = startIndex; i < tables.length; i++) {
      const table = tables[i];
      
      // Si la mesa puede acomodar al resto del grupo
      if (table.capacity >= remainingPartySize) {
        currentCombination.push(table);
        combinations.push([...currentCombination]);
        currentCombination.pop();
      } 
      // Si la mesa puede acomodar parte del grupo
      else if (table.capacity > 0) {
        currentCombination.push(table);
        this.findTableCombinations(
          tables,
          remainingPartySize - table.capacity,
          currentCombination,
          combinations,
          maxTables,
          i + 1
        );
        currentCombination.pop();
      }
    }
  }
}

// Gestión de estados y transiciones de mesas
export class TableStatusManager {
  /**
   * Obtiene el estado actual de una mesa
   */
  static getCurrentStatus(table: any, reservations: any[] = [], maintenanceRecords: any[] = []) {
    const now = new Date();
    
    // Verificar si está en mantenimiento
    const activeMaintenance = maintenanceRecords.find(maintenance => {
      const maintenanceStart = new Date(maintenance.scheduledStart);
      const maintenanceEnd = new Date(maintenance.scheduledEnd);
      
      return (
        (maintenance.status === 'in_progress') ||
        (maintenance.status === 'scheduled' && 
         maintenanceStart <= now && 
         maintenanceEnd >= now)
      );
    });
    
    if (activeMaintenance) {
      return 'maintenance';
    }
    
    // Verificar si tiene reservas activas
    const activeReservation = reservations.find(reservation => {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);
      
      return reservationStart <= now && reservationEnd >= now;
    });
    
    if (activeReservation) {
      return activeReservation.status === 'seated' ? 'occupied' : 'reserved';
    }
    
    return 'available';
  }

  /**
   * Verifica si se puede realizar una transición de estado
   */
  static canTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'available': ['occupied', 'reserved', 'maintenance'],
      'occupied': ['available'],
      'reserved': ['occupied', 'available'],
      'maintenance': ['available'],
    };
    
    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Realiza una transición de estado
   */
  static transitionStatus(
    table: any,
    toStatus: string,
    options: any = {}
  ): { success: boolean; error?: string } {
    const currentStatus = this.getCurrentStatus(table);
    
    if (!this.canTransition(currentStatus, toStatus)) {
      return {
        success: false,
        error: `Transición no válida: ${currentStatus} -> ${toStatus}`,
      };
    }
    
    // Aquí se implementaría la lógica específica de cada transición
    switch (toStatus) {
      case 'occupied':
        // Marcar mesa como ocupada
        break;
      case 'available':
        // Liberar mesa
        break;
      case 'reserved':
        // Reservar mesa
        break;
      case 'maintenance':
        // Poner mesa en mantenimiento
        break;
    }
    
    return { success: true };
  }
}

// Cálculo de disponibilidad en tiempo real
export class AvailabilityCalculator {
  /**
   * Calcula la disponibilidad de mesas para un período específico
   */
  static calculateAvailability(
    tables: any[],
    date: string,
    startTime: string,
    endTime: string,
    reservations: any[] = [],
    maintenanceRecords: any[] = []
  ) {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    const availableTables = tables.filter(table => {
      // Verificar si está en mantenimiento durante el período
      const hasMaintenance = maintenanceRecords.some(maintenance => {
        const maintenanceStart = new Date(maintenance.scheduledStart);
        const maintenanceEnd = new Date(maintenance.scheduledEnd);
        
        return (
          (maintenance.status === 'in_progress') ||
          (maintenance.status === 'scheduled' && 
           this.timeRangesOverlap(
             maintenanceStart, 
             maintenanceEnd, 
             startDateTime, 
             endDateTime
           ))
        );
      });

      if (hasMaintenance) return false;

      // Verificar si tiene reservas que se solapan
      const hasConflictingReservation = reservations.some(reservation => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);
        
        return this.timeRangesOverlap(
          reservationStart,
          reservationEnd,
          startDateTime,
          endDateTime
        );
      });

      return !hasConflictingReservation;
    });

    return {
      availableTables,
      totalTables: tables.length,
      availableCount: availableTables.length,
      availabilityRate: (availableTables.length / tables.length) * 100,
    };
  }

  /**
   * Verifica si dos rangos de tiempo se solapan
   */
  private static timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return (
      (start1 <= end2 && end1 >= start2) ||
      (start2 <= end1 && end2 >= start1)
    );
  }

  /**
   * Calcula la disponibilidad para múltiples fechas
   */
  static calculateMultiDateAvailability(
    tables: any[],
    dates: string[],
    time: string,
    duration: number,
    reservations: any[] = [],
    maintenanceRecords: any[] = []
  ) {
    const results: Record<string, any> = {};
    
    dates.forEach(date => {
      const startTime = time;
      const endTime = this.addMinutesToTime(time, duration);
      
      results[date] = this.calculateAvailability(
        tables,
        date,
        startTime,
        endTime,
        reservations.filter(r => 
          new Date(r.date).toDateString() === new Date(date).toDateString()
        ),
        maintenanceRecords
      );
    });
    
    return results;
  }

  /**
   * Añade minutos a una hora en formato HH:MM
   */
  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
}

// Optimización de distribución de mesas
export class TableLayoutOptimizer {
  /**
   * Optimiza la distribución de mesas para maximizar la eficiencia
   */
  static optimizeLayout(tables: any[], areas: any[]): any {
    // Agrupar mesas por área
    const tablesByArea: Record<string, any[]> = {};
    
    tables.forEach(table => {
      if (!tablesByArea[table.areaId]) {
        tablesByArea[table.areaId] = [];
      }
      tablesByArea[table.areaId].push(table);
    });

    // Calcular estadísticas por área
    const areaStats: Record<string, any> = {};
    
    Object.keys(tablesByArea).forEach(areaId => {
      const areaTables = tablesByArea[areaId];
      const area = areas.find(a => a.id === areaId);
      
      areaStats[areaId] = {
        name: area?.name || 'Área sin nombre',
        tableCount: areaTables.length,
        totalCapacity: areaTables.reduce((sum, table) => sum + table.capacity, 0),
        averageCapacity: areaTables.reduce((sum, table) => sum + table.capacity, 0) / areaTables.length,
        utilizationRate: 0, // Se calcularía con datos de reservas
      };
    });

    // Sugerencias de optimización
    const suggestions = this.generateOptimizationSuggestions(tablesByArea, areaStats);

    return {
      areaStats,
      suggestions,
    };
  }

  /**
   * Genera sugerencias de optimización
   */
  private static generateOptimizationSuggestions(
    tablesByArea: Record<string, any[]>,
    areaStats: Record<string, any>
  ): string[] {
    const suggestions: string[] = [];

    // Analizar cada área
    Object.keys(areaStats).forEach(areaId => {
      const stats = areaStats[areaId];
      
      // Áreas con pocas mesas
      if (stats.tableCount < 3) {
        suggestions.push(`Considera añadir más mesas en ${stats.name} para mejorar la flexibilidad.`);
      }
      
      // Áreas con capacidad baja
      if (stats.averageCapacity < 4) {
        suggestions.push(`La capacidad promedio en ${stats.name} es baja. Considera añadir mesas más grandes.`);
      }
      
      // Áreas con demasiada capacidad
      if (stats.averageCapacity > 8) {
        suggestions.push(`La capacidad promedio en ${stats.name} es alta. Considera añadir mesas más pequeñas para grupos pequeños.`);
      }
    });

    // Sugerencias generales
    if (Object.keys(tablesByArea).length === 1) {
      suggestions.push('Considera crear múltiples áreas para mejorar la organización y el flujo de clientes.');
    }

    return suggestions;
  }
}

export default {
  TableAssignmentAlgorithm,
  TableStatusManager,
  AvailabilityCalculator,
  TableLayoutOptimizer,
};