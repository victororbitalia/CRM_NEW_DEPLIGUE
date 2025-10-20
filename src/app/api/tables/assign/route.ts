import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// POST /api/tables/assign - Asignación automática de mesas
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      restaurantId,
      date,
      time,
      partySize,
      duration = 120, // Duración en minutos por defecto
      areaId,
      isAccessible = false,
      preferences = {}, // Preferencias adicionales
    } = body;

    // Validar parámetros requeridos
    if (!restaurantId || !date || !time || !partySize) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const partySizeNum = parseInt(partySize, 10);
    const durationNum = parseInt(duration, 10);

    if (isNaN(partySizeNum) || partySizeNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'El tamaño del grupo debe ser un número válido' },
        { status: 400 }
      );
    }

    // Parsear fecha y hora
    const reservationDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(reservationDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationNum);

    // Construir filtros para mesas candidatas
    const where: any = {
      area: {
        restaurantId,
      },
      isActive: true,
      capacity: {
        gte: partySizeNum,
      },
      minCapacity: {
        lte: partySizeNum,
      },
    };

    if (areaId) {
      where.areaId = areaId;
    }

    if (isAccessible) {
      where.isAccessible = true;
    }

    // Obtener mesas candidatas
    const candidateTables = await db.prisma.table.findMany({
      where,
      include: {
        area: true,
        reservations: {
          where: {
            date: {
              gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
              lt: new Date(reservationDate.setHours(23, 59, 59, 999)),
            },
            status: {
              in: ['confirmed', 'seated'],
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
        maintenanceRecords: {
          where: {
            OR: [
              {
                status: 'scheduled',
                scheduledStart: {
                  gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                  lte: new Date(reservationDate.setHours(23, 59, 59, 999)),
                },
              },
              {
                status: 'in_progress',
              },
            ],
          },
        },
      },
      orderBy: [
        { capacity: 'asc' }, // Priorizar mesas más ajustadas al tamaño del grupo
        { area: { name: 'asc' } }, // Luego por nombre de área
      ],
    });

    // Filtrar mesas disponibles
    const availableTables = candidateTables.filter((table: any) => {
      // Verificar si está en mantenimiento durante el período solicitado
      const hasMaintenance = table.maintenanceRecords.some((maintenance: any) => {
        const maintenanceStart = new Date(maintenance.scheduledStart);
        const maintenanceEnd = new Date(maintenance.scheduledEnd);
        
        return (
          (maintenanceStart <= startTime && maintenanceEnd > startTime) ||
          (maintenanceStart < endTime && maintenanceEnd >= endTime) ||
          (maintenanceStart >= startTime && maintenanceEnd <= endTime)
        );
      });

      if (hasMaintenance) {
        return false;
      }

      // Verificar si tiene reservas que se solapan
      const hasConflictingReservation = table.reservations.some((reservation: any) => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);
        
        return (
          (reservationStart <= startTime && reservationEnd > startTime) ||
          (reservationStart < endTime && reservationEnd >= endTime) ||
          (reservationStart >= startTime && reservationEnd <= endTime)
        );
      });

      return !hasConflictingReservation;
    });

    if (availableTables.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assigned: false,
          reason: 'No hay mesas disponibles para los criterios especificados',
          suggestions: await getAlternativeSuggestions(restaurantId, partySizeNum, startTime, endTime),
        },
      });
    }

    // Algoritmo de asignación optimizada
    const scoredTables = availableTables.map((table: any) => {
      let score = 0;
      
      // Puntuación por ajuste de capacidad (preferir mesas más ajustadas)
      const capacityFit = 1 - (table.capacity - partySizeNum) / table.capacity;
      score += capacityFit * 40; // 40% del peso
      
      // Puntuación por área (si hay preferencias)
      if (preferences.areaId && table.areaId === preferences.areaId) {
        score += 30; // 30% del peso si coincide con el área preferida
      }
      
      // Puntuación por forma de mesa (preferencias específicas)
      if (preferences.shape && table.shape === preferences.shape) {
        score += 10; // 10% del peso si coincide con la forma preferida
      }
      
      // Puntuación por ubicación (preferencias específicas)
      if (preferences.location && table.area.name.toLowerCase().includes(preferences.location.toLowerCase())) {
        score += 10; // 10% del peso si coincide con la ubicación preferida
      }
      
      // Puntuación por accesibilidad
      if (isAccessible && table.isAccessible) {
        score += 10; // 10% del peso si se necesita accesibilidad y la mesa la tiene
      }
      
      return {
        table,
        score,
        reasons: {
          capacityFit: Math.round(capacityFit * 100),
          areaMatch: preferences.areaId && table.areaId === preferences.areaId ? 100 : 0,
          shapeMatch: preferences.shape && table.shape === preferences.shape ? 100 : 0,
          locationMatch: preferences.location && table.area.name.toLowerCase().includes(preferences.location.toLowerCase()) ? 100 : 0,
          accessibility: isAccessible && table.isAccessible ? 100 : 0,
        },
      };
    });

    // Ordenar por puntuación y seleccionar la mejor opción
    scoredTables.sort((a, b) => b.score - a.score);
    const bestMatch = scoredTables[0];

    // Obtener alternativas en caso de que se necesiten
    const alternatives = scoredTables.slice(1, 4).map(item => item.table);

    return NextResponse.json({
      success: true,
      data: {
        assigned: true,
        table: bestMatch.table,
        score: Math.round(bestMatch.score),
        reasons: bestMatch.reasons,
        alternatives,
        reservationDetails: {
          date,
          time,
          partySize: partySizeNum,
          duration: durationNum,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error en asignación automática de mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener sugerencias alternativas
async function getAlternativeSuggestions(
  restaurantId: string,
  partySize: number,
  startTime: Date,
  endTime: Date
) {
  try {
    // Buscar horarios alternativos el mismo día
    const suggestions = [];
    
    // Buscar en ventanas de 30 minutos antes y después
    for (let offset = -60; offset <= 60; offset += 30) {
      if (offset === 0) continue; // Ya verificamos este horario
      
      const alternativeTime = new Date(startTime);
      alternativeTime.setMinutes(alternativeTime.getMinutes() + offset);
      
      const alternativeEndTime = new Date(alternativeTime);
      alternativeEndTime.setMinutes(alternativeEndTime.getMinutes() + (endTime.getTime() - startTime.getTime()));
      
      // Verificar si hay mesas disponibles en este horario alternativo
      const availableTables = await db.prisma.table.findMany({
        where: {
          area: {
            restaurantId,
          },
          isActive: true,
          capacity: {
            gte: partySize,
          },
          minCapacity: {
            lte: partySize,
          },
          reservations: {
            none: {
              date: {
                gte: new Date(alternativeTime.setHours(0, 0, 0, 0)),
                lt: new Date(alternativeTime.setHours(23, 59, 59, 999)),
              },
              OR: [
                {
                  startTime: { lt: alternativeEndTime },
                  endTime: { gt: alternativeTime },
                },
              ],
              status: {
                in: ['confirmed', 'seated'],
              },
            },
          },
          maintenanceRecords: {
            none: {
              OR: [
                {
                  scheduledStart: { lt: alternativeEndTime },
                  scheduledEnd: { gt: alternativeTime },
                  status: 'scheduled',
                },
                {
                  status: 'in_progress',
                },
              ],
            },
          },
        },
        take: 1, // Solo necesitamos saber si hay al menos una
      });
      
      if (availableTables.length > 0) {
        suggestions.push({
          time: alternativeTime.toTimeString().slice(0, 5),
          available: true,
          tablesCount: availableTables.length,
        });
      }
    }
    
    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  } catch (error) {
    console.error('Error al obtener sugerencias alternativas:', error);
    return [];
  }
}