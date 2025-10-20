import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/areas/[id] - Obtener un área específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Obtener área con información detallada
    const area = await db.prisma.area.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        tables: {
          where: {
            isActive: true,
          },
          include: {
            reservations: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setDate(new Date().getDate() + 7)),
                },
              },
              orderBy: {
                startTime: 'asc',
              },
              include: {
                customer: true,
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
        },
      },
    });

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Área no encontrada' },
        { status: 404 }
      );
    }

    // Calcular estado actual de cada mesa
    const now = new Date();
    const tablesWithStatus = area.tables.map((table: any) => {
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

    // Calcular estadísticas del área
    let availableCount = 0;
    let occupiedCount = 0;
    let reservedCount = 0;
    let maintenanceCount = 0;

    tablesWithStatus.forEach((table: any) => {
      switch (table.currentStatus) {
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

    const areaWithStats = {
      ...area,
      tables: tablesWithStatus,
      stats: {
        total: area.tables.length,
        available: availableCount,
        occupied: occupiedCount,
        reserved: reservedCount,
        maintenance: maintenanceCount,
        totalCapacity: area.tables.reduce((sum: number, table: any) => sum + table.capacity, 0),
      },
    };

    return NextResponse.json({
      success: true,
      data: areaWithStats,
    });
  } catch (error) {
    console.error('Error al obtener área:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/areas/[id] - Actualizar un área
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      maxCapacity,
      isActive,
    } = body;

    // Verificar que el área exista
    const existingArea = await db.prisma.area.findUnique({
      where: { id },
    });

    if (!existingArea) {
      return NextResponse.json(
        { success: false, error: 'Área no encontrada' },
        { status: 404 }
      );
    }

    // Si se cambia el nombre, verificar que sea único dentro del restaurante
    if (name && name !== existingArea.name) {
      const duplicateArea = await db.prisma.area.findFirst({
        where: {
          restaurantId: existingArea.restaurantId,
          name,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateArea) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un área con ese nombre en este restaurante' },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar área
    const updatedArea = await db.prisma.area.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedArea,
      message: 'Área actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar área:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/areas/[id] - Eliminar un área
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar que el área exista
    const existingArea = await db.prisma.area.findUnique({
      where: { id },
      include: {
        tables: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!existingArea) {
      return NextResponse.json(
        { success: false, error: 'Área no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay mesas activas en el área
    if (existingArea.tables.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar el área porque contiene mesas activas' 
        },
        { status: 409 }
      );
    }

    // Soft delete (marcar como inactiva)
    await db.prisma.area.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Área eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar área:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}