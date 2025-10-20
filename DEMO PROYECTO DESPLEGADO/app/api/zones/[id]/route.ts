import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      displayName,
      color,
      boundaryX,
      boundaryY,
      width,
      height,
      isActive,
    } = await request.json();

    // Check if zone exists
    const existingZone = await prisma.zone.findUnique({
      where: { id: params.id },
    });

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // Update zone
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (color !== undefined) updateData.color = color;
    if (boundaryX !== undefined) updateData.boundaryX = boundaryX;
    if (boundaryY !== undefined) updateData.boundaryY = boundaryY;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedZone = await prisma.zone.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tables: {
          select: {
            id: true,
            number: true,
            capacity: true,
            isAvailable: true,
            positionX: true,
            positionY: true,
          },
        },
      },
    });

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if zone exists
    const existingZone = await prisma.zone.findUnique({
      where: { id: params.id },
      include: {
        tables: true,
      },
    });

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // Check if zone has tables
    if (existingZone.tables.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete zone with assigned tables. Please reassign tables first.' },
        { status: 400 }
      );
    }

    // Delete zone
    await prisma.zone.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
}