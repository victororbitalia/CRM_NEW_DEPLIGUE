import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { positionX, positionY, zoneId } = await request.json();

    // Validate input
    if (
      positionX !== undefined && (typeof positionX !== 'number' || positionX < 0 || positionX > 100)
    ) {
      return NextResponse.json(
        { error: 'positionX must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    if (
      positionY !== undefined && (typeof positionY !== 'number' || positionY < 0 || positionY > 100)
    ) {
      return NextResponse.json(
        { error: 'positionY must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id: params.id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // If zoneId is provided, validate it exists
    if (zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
      });

      if (!zone) {
        return NextResponse.json(
          { error: 'Zone not found' },
          { status: 404 }
        );
      }
    }

    // Update table position and/or zone
    const updateData: any = {};
    if (positionX !== undefined) updateData.positionX = positionX;
    if (positionY !== undefined) updateData.positionY = positionY;
    if (zoneId !== undefined) updateData.zoneId = zoneId;

    const updatedTable = await prisma.table.update({
      where: { id: params.id },
      data: updateData,
      include: {
        zone: true,
      },
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error('Error updating table position:', error);
    return NextResponse.json(
      { error: 'Failed to update table position' },
      { status: 500 }
    );
  }
}