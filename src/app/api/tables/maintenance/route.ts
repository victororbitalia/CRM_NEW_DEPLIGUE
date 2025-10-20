import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/tables/maintenance - Obtener registros de mantenimiento
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
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del restaurante' },
        { status: 400 }
      );
    }

    // Construir filtros
    const where: any = {
      table: {
        area: {
          restaurantId,
        },
      },
    };

    if (tableId) {
      where.tableId = tableId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) {
        where.scheduledStart.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledStart.lte = new Date(endDate);
      }
    }

    // Obtener registros de mantenimiento
    const maintenanceRecords = await db.prisma.tableMaintenance.findMany({
      where,
      include: {
        table: {
          include: {
            area: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: maintenanceRecords,
    });
  } catch (error) {
    console.error('Error al obtener registros de mantenimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/tables/maintenance - Crear un nuevo registro de mantenimiento
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
      tableId,
      reason,
      scheduledStart,
      scheduledEnd,
      notes,
    } = body;

    // Validar datos requeridos
    if (!tableId || !reason || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la mesa exista
    const table = await db.prisma.table.findUnique({
      where: { id: tableId },
      include: {
        area: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'La mesa especificada no existe' },
        { status: 404 }
      );
    }

    // Parsear fechas
    const startDate = new Date(scheduledStart);
    const endDate = new Date(scheduledEnd);

    // Validar que la fecha de fin sea posterior a la de inicio
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'La fecha de fin debe ser posterior a la de inicio' },
        { status: 400 }
      );
    }

    // Verificar si ya hay mantenimiento programado para este período
    const existingMaintenance = await db.prisma.tableMaintenance.findFirst({
      where: {
        tableId,
        OR: [
          {
            // Solapamiento total
            scheduledStart: { lte: startDate },
            scheduledEnd: { gte: endDate },
            status: { in: ['scheduled', 'in_progress'] },
          },
          {
            // Solapamiento parcial
            scheduledStart: { lt: endDate },
            scheduledEnd: { gt: startDate },
            status: { in: ['scheduled', 'in_progress'] },
          },
        ],
      },
    });

    if (existingMaintenance) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un mantenimiento programado para este período' },
        { status: 409 }
      );
    }

    // Verificar si hay reservas conflictivas
    const conflictingReservations = await db.prisma.reservation.findMany({
      where: {
        tableId,
        OR: [
          {
            // Solapamiento total
            startTime: { lte: startDate },
            endTime: { gte: endDate },
            status: { in: ['confirmed', 'seated'] },
          },
          {
            // Solapamiento parcial
            startTime: { lt: endDate },
            endTime: { gt: startDate },
            status: { in: ['confirmed', 'seated'] },
          },
        ],
      },
    });

    if (conflictingReservations.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'No se puede programar mantenimiento porque hay reservas confirmadas',
        data: {
          conflictingReservations: conflictingReservations.map(r => ({
            id: r.id,
            date: r.date,
            startTime: r.startTime,
            endTime: r.endTime,
            customerId: r.customerId,
          })),
        },
      });
    }

    // Crear registro de mantenimiento
    const newMaintenance = await db.prisma.tableMaintenance.create({
      data: {
        tableId,
        reason,
        scheduledStart: startDate,
        scheduledEnd: endDate,
        notes,
        status: 'scheduled',
        createdById: authResult.user?.id,
      },
      include: {
        table: {
          include: {
            area: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newMaintenance,
      message: 'Mantenimiento programado correctamente',
    });
  } catch (error) {
    console.error('Error al crear registro de mantenimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}