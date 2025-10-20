import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// GET /api/tables/maintenance/[id] - Obtener un registro de mantenimiento específico
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

    // Obtener registro de mantenimiento
    const maintenance = await db.prisma.tableMaintenance.findUnique({
      where: { id },
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

    if (!maintenance) {
      return NextResponse.json(
        { success: false, error: 'Registro de mantenimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error('Error al obtener registro de mantenimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/maintenance/[id] - Actualizar un registro de mantenimiento
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
      reason,
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      status,
      notes,
    } = body;

    // Verificar que el registro exista
    const existingMaintenance = await db.prisma.tableMaintenance.findUnique({
      where: { id },
      include: {
        table: true,
      },
    });

    if (!existingMaintenance) {
      return NextResponse.json(
        { success: false, error: 'Registro de mantenimiento no encontrado' },
        { status: 404 }
      );
    }

    // Validar transiciones de estado
    const validTransitions: Record<string, string[]> = {
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Estado final
      'cancelled': [], // Estado final
    };

    if (status && validTransitions[existingMaintenance.status] && 
        !validTransitions[existingMaintenance.status].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Transición de estado no válida: ${existingMaintenance.status} -> ${status}` 
        },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (reason !== undefined) updateData.reason = reason;
    if (scheduledStart !== undefined) updateData.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd !== undefined) updateData.scheduledEnd = new Date(scheduledEnd);
    if (actualStart !== undefined) updateData.actualStart = actualStart ? new Date(actualStart) : null;
    if (actualEnd !== undefined) updateData.actualEnd = actualEnd ? new Date(actualEnd) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Si se está iniciando el mantenimiento, registrar la hora de inicio
    if (status === 'in_progress' && existingMaintenance.status === 'scheduled' && !actualStart) {
      updateData.actualStart = new Date();
    }

    // Si se está completando el mantenimiento, registrar la hora de fin
    if (status === 'completed' && existingMaintenance.status === 'in_progress' && !actualEnd) {
      updateData.actualEnd = new Date();
    }

    // Actualizar registro de mantenimiento
    const updatedMaintenance = await db.prisma.tableMaintenance.update({
      where: { id },
      data: updateData,
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
      data: updatedMaintenance,
      message: 'Registro de mantenimiento actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar registro de mantenimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/maintenance/[id] - Eliminar un registro de mantenimiento
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

    // Verificar que el registro exista
    const existingMaintenance = await db.prisma.tableMaintenance.findUnique({
      where: { id },
    });

    if (!existingMaintenance) {
      return NextResponse.json(
        { success: false, error: 'Registro de mantenimiento no encontrado' },
        { status: 404 }
      );
    }

    // Solo se pueden eliminar registros en estado 'scheduled' o 'cancelled'
    if (!['scheduled', 'cancelled'].includes(existingMaintenance.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Solo se pueden eliminar registros de mantenimiento programados o cancelados' 
        },
        { status: 409 }
      );
    }

    // Eliminar registro de mantenimiento
    await db.prisma.tableMaintenance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Registro de mantenimiento eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar registro de mantenimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}