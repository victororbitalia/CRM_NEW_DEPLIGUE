import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const zones = await prisma.zone.findMany({
      where: {
        isActive: true,
      },
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
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      displayName,
      color = '#e5e7eb',
      boundaryX,
      boundaryY,
      width,
      height,
    } = await request.json();

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      );
    }

    // Check if zone with this name already exists
    const existingZone = await prisma.zone.findFirst({
      where: { name },
    });

    if (existingZone) {
      return NextResponse.json(
        { error: 'Zone with this name already exists' },
        { status: 409 }
      );
    }

    // Create new zone
    const newZone = await prisma.zone.create({
      data: {
        name,
        displayName,
        color,
        boundaryX,
        boundaryY,
        width,
        height,
      },
    });

    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}