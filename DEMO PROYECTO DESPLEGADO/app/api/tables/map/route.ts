import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all tables with their zone information
    const tables = await prisma.table.findMany({
      include: {
        zone: true,
      },
      orderBy: {
        number: 'asc',
      },
    });

    // Get all zones
    const zones = await prisma.zone.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // If no zones exist, create default zones
    if (zones.length === 0) {
      const defaultZones = [
        {
          name: 'interior',
          displayName: 'Interior',
          color: '#e5e7eb',
          boundaryX: 0,
          boundaryY: 0,
          width: 50,
          height: 100,
        },
        {
          name: 'terraza',
          displayName: 'Terraza',
          color: '#dbeafe',
          boundaryX: 50,
          boundaryY: 0,
          width: 50,
          height: 100,
        },
      ];

      await prisma.zone.createMany({
        data: defaultZones,
      });

      // Fetch the newly created zones
      const createdZones = await prisma.zone.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({
        tables,
        zones: createdZones,
      });
    }

    return NextResponse.json({
      tables,
      zones,
    });
  } catch (error) {
    console.error('Error fetching table map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table map data' },
      { status: 500 }
    );
  }
}