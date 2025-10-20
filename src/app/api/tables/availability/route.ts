import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/tables/availability - Consultar disponibilidad de mesas
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const areaId = searchParams.get('areaId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const partySize = searchParams.get('partySize');
    const duration = searchParams.get('duration') || '120'; // Duración en minutos por defecto

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

    // Construir filtros para mesas
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

    // Obtener mesas con sus reservas
    const tables = await db.prisma.table.findMany({
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
      orderBy: {
        capacity: 'asc',
      },
    });

    // Verificar disponibilidad de cada mesa
    const availableTables = tables.filter((table: any) => {
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

    // Agrupar mesas por área
    const tablesByArea: Record<string, any[]> = {};
    availableTables.forEach((table: any) => {
      if (!tablesByArea[table.areaId]) {
        tablesByArea[table.areaId] = [];
      }
      tablesByArea[table.areaId].push(table);
    });

    // Obtener información de áreas
    const areaIds = Object.keys(tablesByArea);
    const areas = await db.prisma.area.findMany({
      where: {
        id: { in: areaIds },
      },
    });

    // Construir respuesta
    const areaAvailability = areas.map((area: any) => ({
      area: {
        id: area.id,
        name: area.name,
        description: area.description,
      },
      tables: tablesByArea[area.id] || [],
      availableCount: (tablesByArea[area.id] || []).length,
      totalCapacity: (tablesByArea[area.id] || []).reduce((sum: number, table: any) => sum + table.capacity, 0),
    }));

    // Estadísticas generales
    const stats = {
      totalAvailable: availableTables.length,
      totalTables: tables.length,
      totalCapacity: availableTables.reduce((sum: number, table: any) => sum + table.capacity, 0),
      areasAvailable: areaAvailability.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date,
        time,
        partySize: partySizeNum,
        duration: durationNum,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        areaAvailability,
        availableTables,
        stats,
      },
    });
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}