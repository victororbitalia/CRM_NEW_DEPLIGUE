import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiResponse } from '@/types';

// GET /api/tables - Obtener todas las mesas
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
    const status = searchParams.get('status');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del restaurante' },
        { status: 400 }
      );
    }

    // Construir filtros
    const where: any = {
      area: {
        restaurantId,
      },
      isActive: true,
    };

    if (areaId) {
      where.areaId = areaId;
    }

    // Obtener mesas con información de área y estado actual
    const tables = await db.prisma.table.findMany({
      where,
      include: {
        area: true,
        reservations: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
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
                  gte: new Date(),
                },
              },
              {
                status: 'in_progress',
              },
            ],
          },
          orderBy: {
            scheduledStart: 'asc',
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    // Calcular estado actual de cada mesa
    const tablesWithStatus = tables.map((table: any) => {
      const now = new Date();
      let currentStatus = 'available'; // available, occupied, reserved, maintenance
      
      // Verificar si está en mantenimiento
      const activeMaintenance = table.maintenanceRecords.find((m: any) =>
        (m.status === 'in_progress') ||
        (m.status === 'scheduled' && m.scheduledStart <= now && m.scheduledEnd >= now)
      );
      
      if (activeMaintenance) {
        currentStatus = 'maintenance';
      } else {
        // Verificar reservas activas
        const activeReservation = table.reservations.find((r: any) => {
          const startTime = new Date(r.startTime);
          const endTime = new Date(r.endTime);
          return startTime <= now && endTime >= now;
        });
        
        if (activeReservation) {
          currentStatus = activeReservation.status === 'seated' ? 'occupied' : 'reserved';
        }
      }

      return {
        ...table,
        currentStatus,
        currentReservation: table.reservations.find((r: any) => {
          const startTime = new Date(r.startTime);
          const endTime = new Date(r.endTime);
          return startTime <= now && endTime >= now;
        }),
        upcomingMaintenance: table.maintenanceRecords.find((m: any) =>
          m.status === 'scheduled' && m.scheduledStart > now
        ),
      };
    });

    // Filtrar por estado si se especifica
    const filteredTables = status
      ? tablesWithStatus.filter((table: any) => table.currentStatus === status)
      : tablesWithStatus;

    return NextResponse.json({
      success: true,
      data: filteredTables,
    });
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/tables - Crear una nueva mesa
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
      areaId,
      number,
      capacity,
      minCapacity = 1,
      positionX,
      positionY,
      width,
      height,
      shape = 'rectangle',
      isAccessible = false,
    } = body;

    // Validar datos requeridos
    if (!areaId || !number || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el área exista
    const area = await db.prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'El área especificada no existe' },
        { status: 404 }
      );
    }

    // Verificar que el número de mesa sea único dentro del área
    const existingTable = await db.prisma.table.findFirst({
      where: {
        areaId,
        number,
        isActive: true,
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una mesa con ese número en esta área' },
        { status: 409 }
      );
    }

    // Crear la mesa
    const newTable = await db.prisma.table.create({
      data: {
        areaId,
        number,
        capacity,
        minCapacity,
        positionX,
        positionY,
        width,
        height,
        shape,
        isAccessible,
      },
      include: {
        area: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newTable,
      message: 'Mesa creada correctamente',
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}