import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/tables/[id] - Obtener una mesa específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Obtener mesa con información detallada
    const table = await db.prisma.table.findUnique({
      where: { id },
      include: {
        area: true,
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
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Calcular estado actual
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

    const tableWithStatus = {
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

    return NextResponse.json({
      success: true,
      data: tableWithStatus,
    });
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id] - Actualizar una mesa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      number,
      capacity,
      minCapacity,
      positionX,
      positionY,
      width,
      height,
      shape,
      isAccessible,
      isActive,
    } = body;

    // Verificar que la mesa exista
    const existingTable = await db.prisma.table.findUnique({
      where: { id },
      include: { area: true },
    });

    if (!existingTable) {
      return NextResponse.json(
        { success: false, error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Si se cambia el número, verificar que sea único dentro del área
    if (number && number !== existingTable.number) {
      const duplicateTable = await db.prisma.table.findFirst({
        where: {
          areaId: existingTable.areaId,
          number,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateTable) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una mesa con ese número en esta área' },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (number !== undefined) updateData.number = number;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (minCapacity !== undefined) updateData.minCapacity = minCapacity;
    if (positionX !== undefined) updateData.positionX = positionX;
    if (positionY !== undefined) updateData.positionY = positionY;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (shape !== undefined) updateData.shape = shape;
    if (isAccessible !== undefined) updateData.isAccessible = isAccessible;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar mesa
    const updatedTable = await db.prisma.table.update({
      where: { id },
      data: updateData,
      include: {
        area: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTable,
      message: 'Mesa actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Eliminar una mesa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que la mesa exista
    const existingTable = await db.prisma.table.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: {
              in: ['pending', 'confirmed', 'seated'],
            },
            date: {
              gte: new Date(),
            },
          },
        },
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        { success: false, error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay reservas futuras asociadas
    if (existingTable.reservations.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar la mesa porque tiene reservas futuras asociadas' 
        },
        { status: 409 }
      );
    }

    // Soft delete (marcar como inactiva)
    await db.prisma.table.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Mesa eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}