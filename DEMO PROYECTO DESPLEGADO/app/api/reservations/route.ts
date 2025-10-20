import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultSettings } from '@/lib/defaultSettings';

// GET /api/reservations - Listar todas las reservas con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const name = searchParams.get('name') || searchParams.get('customerName');
    const phone = searchParams.get('phone') || searchParams.get('customerPhone');
    const time = searchParams.get('time');

    const where: any = {};
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
    if (time) {
      where.time = time;
    }
    if (name) {
      where.customerName = { contains: name, mode: 'insensitive' };
    }
    if (phone) {
      where.customerPhone = { contains: phone };
    }

    const data = await prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        date: true,
        time: true,
        guests: true,
        status: true,
        specialRequests: true,
        createdAt: true,
        tableId: true,
      },
    });

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}

// POST /api/reservations - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/reservations - Body recibido:', body);

    // Validaciones
    if (!body.customerName || !body.customerEmail || !body.customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos del cliente (nombre, email, teléfono)' },
        { status: 400 }
      );
    }

    if (!body.date || !body.time || !body.guests) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos de la reserva (fecha, hora, comensales)' },
        { status: 400 }
      );
    }

    if (body.guests < 1 || body.guests > 20) {
      return NextResponse.json(
        { success: false, error: 'El número de comensales debe estar entre 1 y 20' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Obtener configuración del restaurante (singleton); fallback a defaultSettings si no existe
    const settingsRecord = await prisma.restaurantSettings.findUnique({ where: { id: 'settings-singleton' } });
    const settings = (settingsRecord?.data as any) || (defaultSettings as any);

    // Validar capacidad del restaurante
    const reservationDate = new Date(body.date);
    const now = new Date();

    // Validación: no permitir reservas en fechas pasadas
    const startOfRequestedDay = new Date(reservationDate);
    startOfRequestedDay.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    if (reservationDate < now && reservationDate < endOfToday) {
      return NextResponse.json(
        { success: false, error: 'No se pueden crear reservas en fechas pasadas' },
        { status: 409 }
      );
    }
    const dayOfWeek = reservationDate.getDay(); // 0 = domingo, 1 = lunes, etc.
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekdayRules = settings.weekdayRules as any;

    // Verificar si el día está habilitado
    const dayKey = dayNames[dayOfWeek];
    if (!weekdayRules?.[dayKey]) {
      return NextResponse.json(
        { success: false, error: 'Reglas de capacidad no definidas para este día' },
        { status: 409 }
      );
    }
    // Verificar si el día está habilitado (si existe bandera)
    if (weekdayRules[dayKey]?.enabled === false) {
      return NextResponse.json(
        { success: false, error: 'El restaurante no está abierto este día' },
        { status: 409 }
      );
    }

    // Obtener reglas del día específico
    const dayRules = weekdayRules[dayKey];
    const maxReservations = dayRules.maxReservations || 50;
    const maxGuestsTotal = dayRules.maxGuestsTotal || 100;

    // Validación: respetar maxAdvanceDays de configuración global
    const maxAdvanceDays = (settings.reservations && settings.reservations.maxAdvanceDays) || 365;
    const diffMs = reservationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > maxAdvanceDays) {
      return NextResponse.json(
        { success: false, error: `No se pueden crear reservas con más de ${maxAdvanceDays} días de anticipación` },
        { status: 409 }
      );
    }

    // Contar reservas existentes para la fecha
    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['pending', 'confirmed']
        }
      },
      select: {
        id: true,
        guests: true,
        status: true,
        date: true,
        time: true,
        tableId: true,
      },
    });

    // Verificar límite de reservas
    if (existingReservations.length >= maxReservations) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay disponibilidad para este día. Límite de reservas alcanzado.',
          details: {
            maxReservations,
            currentReservations: existingReservations.length,
            availableSlots: 0
          }
        },
        { status: 409 }
      );
    }

    // Verificar límite de comensales totales
    const totalGuests = existingReservations.reduce((sum, res) => sum + res.guests, 0);
    if (totalGuests + body.guests > maxGuestsTotal) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay disponibilidad para este día. Límite de comensales alcanzado.',
          details: {
            maxGuestsTotal,
            currentGuests: totalGuests,
            requestedGuests: body.guests,
            availableGuests: maxGuestsTotal - totalGuests
          }
        },
        { status: 409 }
      );
    }

    // Verificar disponibilidad de mesas si se especifica una mesa
    if (body.tableId) {
      const tableExists = await prisma.table.findUnique({
        where: { id: body.tableId }
      });

      if (!tableExists) {
        return NextResponse.json(
          { success: false, error: 'La mesa especificada no existe' },
          { status: 400 }
        );
      }

      // Verificar si la mesa ya está reservada en esa fecha y hora
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          tableId: body.tableId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          time: body.time,
          status: {
            in: ['pending', 'confirmed']
          }
        }
      });

      if (conflictingReservation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La mesa ya está reservada para esta fecha y hora',
            details: {
              tableId: body.tableId,
              conflictingTime: body.time,
              conflictingReservationId: conflictingReservation.id
            }
          },
          { status: 409 }
        );
      }
    } else {
      // Asignación automática de mesa si no se proporciona tableId
      const preferredLocation: string = body.preferredLocation || settings.reservations?.defaultPreferredLocation || 'any';

      // Candidatas por capacidad (y ubicación si se indica)
      const candidateTables = await prisma.table.findMany({
        where: {
          capacity: { gte: body.guests },
          ...(preferredLocation !== 'any' ? { location: preferredLocation } : {}),
        },
        orderBy: { capacity: 'asc' }, // mejor ajuste primero
      });

      // Filtrar mesas que no estén en conflicto a esa fecha/hora
      let assignedTableId: string | undefined;
      for (const table of candidateTables) {
        const conflict = await prisma.reservation.findFirst({
          where: {
            tableId: table.id,
            date: { gte: startOfDay, lte: endOfDay },
            time: body.time,
            status: { in: ['pending', 'confirmed'] },
          },
          select: { id: true },
        });
        if (!conflict) {
          assignedTableId = table.id;
          break;
        }
      }

      if (!assignedTableId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No hay mesas disponibles que cumplan los criterios',
            details: { preferredLocation, guests: body.guests },
          },
          { status: 409 }
        );
      }

      body.tableId = assignedTableId;
    }

    console.log('Creando reserva en BD...');
    const newReservation = await prisma.reservation.create({
      data: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        date: new Date(body.date),
        time: body.time,
        guests: body.guests,
        tableId: body.tableId || undefined,
        status: body.status || 'pending',
        specialRequests: body.specialRequests || undefined,
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        date: true,
        time: true,
        guests: true,
        status: true,
        specialRequests: true,
        createdAt: true,
        tableId: true,
      },
    });

    console.log('Reserva creada exitosamente:', newReservation);
    return NextResponse.json({ success: true, data: newReservation, message: 'Reserva creada exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}



