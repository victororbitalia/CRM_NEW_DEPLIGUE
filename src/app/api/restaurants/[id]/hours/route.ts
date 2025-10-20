import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import {
  CreateOperatingHourData,
  UpdateOperatingHourData
} from '@/types';

// Type for bulk update operations
interface OperatingHourUpdateData extends UpdateOperatingHourData {
  id: string;
}

// Get all operating hours for a restaurant
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
      const includeSpecial = searchParams.get('includeSpecial') === 'true';

      const operatingHours = await db.prisma.operatingHour.findMany({
        where: { 
          restaurantId: id,
          ...(includeSpecial ? {} : { isSpecialDay: false })
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { openTime: 'asc' }
        ],
      });

      return NextResponse.json({
        success: true,
        data: operatingHours,
      });
    } catch (error) {
      console.error('Error fetching operating hours:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operating hours' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Create new operating hours
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const hourData: CreateOperatingHourData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      // Validate required fields
      if (hourData.dayOfWeek === undefined || hourData.dayOfWeek === null) {
        return NextResponse.json(
          { error: 'Day of week is required (0-6, where 0 is Sunday)' },
          { status: 400 }
        );
      }

      if (hourData.dayOfWeek < 0 || hourData.dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        );
      }

      // Validate time format if not closed
      if (!hourData.isClosed) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!hourData.openTime || !timeRegex.test(hourData.openTime)) {
          return NextResponse.json(
            { error: 'Valid open time is required (HH:MM format)' },
            { status: 400 }
          );
        }

        if (!hourData.closeTime || !timeRegex.test(hourData.closeTime)) {
          return NextResponse.json(
            { error: 'Valid close time is required (HH:MM format)' },
            { status: 400 }
          );
        }

        // Validate that close time is after open time
        const [openHour, openMin] = hourData.openTime.split(':').map(Number);
        const [closeHour, closeMin] = hourData.closeTime.split(':').map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (closeMinutes <= openMinutes) {
          return NextResponse.json(
            { error: 'Close time must be after open time' },
            { status: 400 }
          );
        }
      }

      // Check if operating hours already exist for this day and special date
      const existingHours = await db.prisma.operatingHour.findFirst({
        where: {
          restaurantId: id,
          dayOfWeek: hourData.dayOfWeek,
          specialDate: hourData.specialDate,
        },
      });

      if (existingHours) {
        return NextResponse.json(
          { error: 'Operating hours already exist for this day and date' },
          { status: 409 }
        );
      }

      const operatingHour = await db.prisma.operatingHour.create({
        data: {
          ...hourData,
          restaurantId: id,
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'operating_hour',
          resourceId: operatingHour.id,
          metadata: {
            restaurantId: id,
            dayOfWeek: hourData.dayOfWeek,
            isSpecialDay: hourData.isSpecialDay,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: operatingHour,
      });
    } catch (error) {
      console.error('Error creating operating hours:', error);
      return NextResponse.json(
        { error: 'Failed to create operating hours' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);

// Update multiple operating hours (bulk update)
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const { hours }: { hours: OperatingHourUpdateData[] } = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      if (!hours || !Array.isArray(hours)) {
        return NextResponse.json(
          { error: 'Hours array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const hourData of hours) {
        if (!hourData.id) {
          return NextResponse.json(
            { error: 'Each hour entry must have an ID' },
            { status: 400 }
          );
        }

        // Validate time format if not closed
        if (hourData.isClosed === false) {
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          
          if (hourData.openTime && !timeRegex.test(hourData.openTime)) {
            return NextResponse.json(
              { error: 'Invalid open time format (HH:MM required)' },
              { status: 400 }
            );
          }

          if (hourData.closeTime && !timeRegex.test(hourData.closeTime)) {
            return NextResponse.json(
              { error: 'Invalid close time format (HH:MM required)' },
              { status: 400 }
            );
          }

          // Validate that close time is after open time
          if (hourData.openTime && hourData.closeTime) {
            const [openHour, openMin] = hourData.openTime.split(':').map(Number);
            const [closeHour, closeMin] = hourData.closeTime.split(':').map(Number);
            const openMinutes = openHour * 60 + openMin;
            const closeMinutes = closeHour * 60 + closeMin;

            if (closeMinutes <= openMinutes) {
              return NextResponse.json(
                { error: 'Close time must be after open time' },
                { status: 400 }
              );
            }
          }
        }

        // Check if the operating hour exists and belongs to this restaurant
        const existingHour = await db.prisma.operatingHour.findFirst({
          where: {
            id: hourData.id,
            restaurantId: id,
          },
        });

        if (!existingHour) {
          return NextResponse.json(
            { error: `Operating hour with ID ${hourData.id} not found` },
            { status: 404 }
          );
        }

        const updatedHour = await db.prisma.operatingHour.update({
          where: { id: hourData.id },
          data: hourData,
        });

        results.push(updatedHour);
      }

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'operating_hours',
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
      console.error('Error updating operating hours:', error);
      return NextResponse.json(
        { error: 'Failed to update operating hours' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);