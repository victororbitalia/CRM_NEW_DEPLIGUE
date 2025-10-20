import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tables/availability - Verificar disponibilidad de mesas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const guests = searchParams.get('guests');
    const location = searchParams.get('location');
    const zoneId = searchParams.get('zoneId');

    if (!date || !time || !guests) {
      return NextResponse.json(
        { success: false, error: 'Se requieren los parámetros: date, time, guests' },
        { status: 400 }
      );
    }

    const guestsNum = parseInt(guests);
    if (isNaN(guestsNum) || guestsNum < 1) {
      return NextResponse.json(
        { success: false, error: 'El número de comensales debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Construir filtro para Prisma
    const where: any = {
      isAvailable: true,
      capacity: { gte: guestsNum },
    };

    // Filtrar por ubicación si se especifica
    if (location) {
      where.location = location;
    }

    // Filtrar por zona si se especifica
    if (zoneId) {
      where.zoneId = zoneId;
    }

    // Obtener mesas disponibles desde la base de datos
    const availableTables = await prisma.table.findMany({
      where,
      include: {
        zone: true,
      },
      orderBy: { capacity: 'asc' }, // Las más pequeñas primero para optimizar
    });

    // Check for existing reservations at the requested date and time
    const reservationDateTime = new Date(`${date}T${time}:00`);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get reservations for the same day
    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['pending', 'confirmed', 'seated'],
        },
        NOT: {
          status: 'cancelled',
        },
      },
      include: {
        table: true,
      },
    });

    // Filter out tables that already have reservations at the requested time
    // This is a simple check - in a real implementation, you'd need to consider reservation duration
    const tablesWithReservations = new Set(
      existingReservations
        .filter(r => r.time === time) // Simple time match - consider duration in real implementation
        .map(r => r.tableId)
    );

    const trulyAvailableTables = availableTables.filter(
      table => !tablesWithReservations.has(table.id)
    );

    return NextResponse.json({
      success: true,
      data: {
        available: trulyAvailableTables.length > 0,
        tables: trulyAvailableTables,
        count: trulyAvailableTables.length,
        requestedFor: {
          date,
          time,
          guests: guestsNum,
          location: location || 'any',
          zoneId: zoneId || 'any',
        },
        existingReservations: existingReservations.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al verificar disponibilidad' },
      { status: 500 }
    );
  }
}



