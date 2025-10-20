import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { 
  CreateAreaData, 
  UpdateAreaData 
} from '@/types';

// Get all areas for a restaurant
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const includeTables = searchParams.get('includeTables') === 'true';

      const areas = await db.prisma.area.findMany({
        where: { 
          restaurantId: id,
          ...(includeInactive ? {} : { isActive: true })
        },
        include: {
          ...(includeTables ? {
            tables: {
              where: includeInactive ? {} : { isActive: true },
              select: {
                id: true,
                number: true,
                capacity: true,
                minCapacity: true,
                isAccessible: true,
                positionX: true,
                positionY: true,
                width: true,
                height: true,
                shape: true,
              },
            },
          } : {}),
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: areas,
      });
    } catch (error) {
      console.error('Error fetching areas:', error);
      return NextResponse.json(
        { error: 'Failed to fetch areas' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Create a new area
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const areaData: CreateAreaData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!areaData.name || areaData.name.trim() === '') {
        return NextResponse.json(
          { error: 'Area name is required' },
          { status: 400 }
        );
      }

      if (!areaData.maxCapacity || areaData.maxCapacity <= 0) {
        return NextResponse.json(
          { error: 'Maximum capacity must be greater than 0' },
          { status: 400 }
        );
      }

      // Check if area name already exists for this restaurant
      const existingArea = await db.prisma.area.findFirst({
        where: {
          restaurantId: id,
          name: areaData.name.trim(),
        },
      });

      if (existingArea) {
        return NextResponse.json(
          { error: 'An area with this name already exists' },
          { status: 409 }
        );
      }

      // Check if restaurant exists
      const restaurant = await db.prisma.restaurant.findUnique({
        where: { id },
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      const area = await db.prisma.area.create({
        data: {
          ...areaData,
          name: areaData.name.trim(),
          restaurantId: id,
          isActive: areaData.isActive !== undefined ? areaData.isActive : true,
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'area',
          resourceId: area.id,
          metadata: {
            restaurantId: id,
            areaName: area.name,
            maxCapacity: area.maxCapacity,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: area,
      });
    } catch (error) {
      console.error('Error creating area:', error);
      return NextResponse.json(
        { error: 'Failed to create area' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);

// Update multiple areas (bulk update)
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const { areas }: { areas: (UpdateAreaData & { id: string })[] } = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      if (!areas || !Array.isArray(areas)) {
        return NextResponse.json(
          { error: 'Areas array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const areaData of areas) {
        if (!areaData.id) {
          return NextResponse.json(
            { error: 'Each area entry must have an ID' },
            { status: 400 }
          );
        }

        // Validate max capacity if provided
        if (areaData.maxCapacity !== undefined && areaData.maxCapacity <= 0) {
          return NextResponse.json(
            { error: 'Maximum capacity must be greater than 0' },
            { status: 400 }
          );
        }

        // Validate name if provided
        if (areaData.name && areaData.name.trim() === '') {
          return NextResponse.json(
            { error: 'Area name cannot be empty' },
            { status: 400 }
          );
        }

        // Check if the area exists and belongs to this restaurant
        const existingArea = await db.prisma.area.findFirst({
          where: {
            id: areaData.id,
            restaurantId: id,
          },
        });

        if (!existingArea) {
          return NextResponse.json(
            { error: `Area with ID ${areaData.id} not found` },
            { status: 404 }
          );
        }

        // Check if area name already exists for this restaurant (if name is being updated)
        if (areaData.name && areaData.name.trim() !== existingArea.name) {
          const duplicateArea = await db.prisma.area.findFirst({
            where: {
              restaurantId: id,
              name: areaData.name.trim(),
              id: { not: areaData.id },
            },
          });

          if (duplicateArea) {
            return NextResponse.json(
              { error: 'An area with this name already exists' },
              { status: 409 }
            );
          }
        }

        const updateData: UpdateAreaData = {
          ...areaData,
          ...(areaData.name ? { name: areaData.name.trim() } : {}),
        };

        const updatedArea = await db.prisma.area.update({
          where: { id: areaData.id },
          data: updateData,
        });

        results.push(updatedArea);
      }

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'areas',
          resourceId: id,
          metadata: {
            restaurantId: id,
            updatedCount: results.length,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Error updating areas:', error);
      return NextResponse.json(
        { error: 'Failed to update areas' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);