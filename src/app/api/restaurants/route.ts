import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import {
  CreateRestaurantData,
  UpdateRestaurantData,
  RestaurantWithRelations
} from '@/types';

// Get all restaurants
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';
      
      const restaurants = await db.restaurants.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: {
          settings: true,
          areas: {
            where: includeInactive ? {} : { isActive: true },
            include: {
              tables: {
                where: includeInactive ? {} : { isActive: true },
                select: {
                  id: true,
                  number: true,
                  capacity: true,
                  minCapacity: true,
                  isAccessible: true,
                },
              },
            },
          },
          operatingHours: {
            orderBy: { dayOfWeek: 'asc' },
          },
          businessRules: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { priority: 'asc' },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: restaurants,
      });
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff'] // Roles that can access this endpoint
);

// Create a new restaurant
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const restaurantData: CreateRestaurantData = await request.json();

      // Validate required fields
      const requiredFields = ['name', 'address', 'city', 'phone', 'email'];
      for (const field of requiredFields) {
        if (!restaurantData[field as keyof CreateRestaurantData]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(restaurantData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      const restaurant = await db.restaurants.create({
        data: {
          ...restaurantData,
          settings: {
            create: {
              language: 'es',
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '24h',
              defaultReservationDuration: 120,
              maxAdvanceBookingDays: 30,
              minAdvanceBookingHours: 2,
              maxPartySize: 20,
              enableOnlineBookings: true,
              enableWaitlist: true,
              confirmationEmailEnabled: true,
              reminderEmailEnabled: true,
              reminderEmailHoursBefore: 24,
              cancellationEmailEnabled: true,
              autoCancelNoShowMinutes: 15,
            },
          },
        },
        include: {
          settings: true,
        },
      });

      // Create default operating hours (closed on Sunday)
      const days = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
      for (const dayOfWeek of days) {
        await db.prisma.operatingHour.create({
          data: {
            restaurantId: restaurant.id,
            dayOfWeek,
            openTime: '12:00',
            closeTime: '16:00',
            isClosed: false,
          },
        });

        await db.prisma.operatingHour.create({
          data: {
            restaurantId: restaurant.id,
            dayOfWeek,
            openTime: '19:00',
            closeTime: '23:00',
            isClosed: false,
          },
        });
      }

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'restaurant',
          resourceId: restaurant.id,
          metadata: {
            restaurantName: restaurant.name,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager'] // Only admin and manager can create restaurants
);