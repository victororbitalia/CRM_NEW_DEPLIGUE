import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/areas - Obtener todas las áreas
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

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del restaurante' },
        { status: 400 }
      );
    }

    // Obtener áreas con información de mesas
    const areas = await db.prisma.area.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      include: {
        tables: {
          where: {
            isActive: true,
          },
          include: {
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
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calcular estadísticas para cada área
    const areasWithStats = areas.map((area: any) => {
      const now = new Date();
      let availableCount = 0;
      let occupiedCount = 0;
      let reservedCount = 0;
      let maintenanceCount = 0;

      area.tables.forEach((table: any) => {
        let currentStatus = 'available';
        
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

        switch (currentStatus) {
          case 'available':
            availableCount++;
            break;
          case 'occupied':
            occupiedCount++;
            break;
          case 'reserved':
            reservedCount++;
            break;
          case 'maintenance':
            maintenanceCount++;
            break;
        }
      });

      return {
        ...area,
        stats: {
          total: area.tables.length,
          available: availableCount,
          occupied: occupiedCount,
          reserved: reservedCount,
          maintenance: maintenanceCount,
          totalCapacity: area.tables.reduce((sum: number, table: any) => sum + table.capacity, 0),
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: areasWithStats,
    });
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/areas - Crear una nueva área
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
      name,
      description,
      maxCapacity,
      isActive = true,
    } = body;

    // Validar datos requeridos
    if (!restaurantId || !name || !maxCapacity) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el restaurante exista
    const restaurant = await db.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'El restaurante especificado no existe' },
        { status: 404 }
      );
    }

    // Verificar que el nombre de área sea único dentro del restaurante
    const existingArea = await db.prisma.area.findFirst({
      where: {
        restaurantId,
        name,
        isActive: true,
      },
    });

    if (existingArea) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un área con ese nombre en este restaurante' },
        { status: 409 }
      );
    }

    // Crear el área
    const newArea = await db.prisma.area.create({
      data: {
        restaurantId,
        name,
        description,
        maxCapacity,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: newArea,
      message: 'Área creada correctamente',
    });
  } catch (error) {
    console.error('Error al crear área:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}