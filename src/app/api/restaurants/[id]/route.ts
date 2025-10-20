import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { UpdateRestaurantData } from '@/types';

// Get a single restaurant by ID
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      const restaurant = await db.prisma.restaurant.findUnique({
        where: { id },
        include: {
          settings: true,
          areas: {
            where: { isActive: true },
            include: {
              tables: {
                where: { isActive: true },
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
            where: { isActive: true },
            orderBy: { priority: 'asc' },
          },
        },
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurant' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Update a restaurant
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      const updateData: UpdateRestaurantData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      // Check if restaurant exists
      const existingRestaurant = await db.prisma.restaurant.findUnique({
        where: { id },
      });

      if (!existingRestaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      // Validate email format if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }
      }

      const restaurant = await db.prisma.restaurant.update({
        where: { id },
        data: updateData,
        include: {
          settings: true,
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'restaurant',
          resourceId: restaurant.id,
          metadata: {
            restaurantName: restaurant.name,
            updatedFields: Object.keys(updateData),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to update restaurant' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);

// Delete a restaurant (soft delete)
export const DELETE = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      // Check if restaurant exists
      const existingRestaurant = await db.prisma.restaurant.findUnique({
        where: { id },
      });

      if (!existingRestaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }

      // Soft delete by setting isActive to false
      const restaurant = await db.prisma.restaurant.update({
        where: { id },
        data: { isActive: false },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'delete',
          resource: 'restaurant',
          resourceId: restaurant.id,
          metadata: {
            restaurantName: restaurant.name,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Restaurant deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to delete restaurant' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);