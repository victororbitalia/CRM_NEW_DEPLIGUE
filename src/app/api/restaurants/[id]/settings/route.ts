import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { UpdateRestaurantSettingsData } from '@/types';

// Get restaurant settings
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

      let settings = await db.prisma.restaurantSettings.findUnique({
        where: { restaurantId: id },
      });

      // If settings don't exist, create default settings
      if (!settings) {
        settings = await db.prisma.restaurantSettings.create({
          data: {
            restaurantId: id,
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
        });
      }

      return NextResponse.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurant settings' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Update restaurant settings
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const settingsData: UpdateRestaurantSettingsData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
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

      // Validate settings data
      if (settingsData.defaultReservationDuration !== undefined && 
          (settingsData.defaultReservationDuration < 15 || settingsData.defaultReservationDuration > 480)) {
        return NextResponse.json(
          { error: 'Default reservation duration must be between 15 and 480 minutes' },
          { status: 400 }
        );
      }

      if (settingsData.maxAdvanceBookingDays !== undefined && 
          (settingsData.maxAdvanceBookingDays < 1 || settingsData.maxAdvanceBookingDays > 365)) {
        return NextResponse.json(
          { error: 'Max advance booking days must be between 1 and 365' },
          { status: 400 }
        );
      }

      if (settingsData.minAdvanceBookingHours !== undefined && 
          (settingsData.minAdvanceBookingHours < 0 || settingsData.minAdvanceBookingHours > 168)) {
        return NextResponse.json(
          { error: 'Min advance booking hours must be between 0 and 168' },
          { status: 400 }
        );
      }

      if (settingsData.maxPartySize !== undefined && 
          (settingsData.maxPartySize < 1 || settingsData.maxPartySize > 100)) {
        return NextResponse.json(
          { error: 'Max party size must be between 1 and 100' },
          { status: 400 }
        );
      }

      if (settingsData.reminderEmailHoursBefore !== undefined && 
          (settingsData.reminderEmailHoursBefore < 1 || settingsData.reminderEmailHoursBefore > 168)) {
        return NextResponse.json(
          { error: 'Reminder email hours before must be between 1 and 168' },
          { status: 400 }
        );
      }

      if (settingsData.autoCancelNoShowMinutes !== undefined && 
          (settingsData.autoCancelNoShowMinutes < 5 || settingsData.autoCancelNoShowMinutes > 120)) {
        return NextResponse.json(
          { error: 'Auto cancel no-show minutes must be between 5 and 120' },
          { status: 400 }
        );
      }

      // Validate language if provided
      if (settingsData.language) {
        const validLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt'];
        if (!validLanguages.includes(settingsData.language)) {
          return NextResponse.json(
            { error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` },
            { status: 400 }
          );
        }
      }

      // Validate date format if provided
      if (settingsData.dateFormat) {
        const validDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];
        if (!validDateFormats.includes(settingsData.dateFormat)) {
          return NextResponse.json(
            { error: `Invalid date format. Must be one of: ${validDateFormats.join(', ')}` },
            { status: 400 }
          );
        }
      }

      // Validate time format if provided
      if (settingsData.timeFormat) {
        const validTimeFormats = ['12h', '24h'];
        if (!validTimeFormats.includes(settingsData.timeFormat)) {
          return NextResponse.json(
            { error: `Invalid time format. Must be one of: ${validTimeFormats.join(', ')}` },
            { status: 400 }
          );
        }
      }

      // Check if settings exist
      let settings = await db.prisma.restaurantSettings.findUnique({
        where: { restaurantId: id },
      });

      let updatedSettings;

      if (settings) {
        // Update existing settings
        updatedSettings = await db.prisma.restaurantSettings.update({
          where: { restaurantId: id },
          data: settingsData,
        });
      } else {
        // Create new settings
        updatedSettings = await db.prisma.restaurantSettings.create({
          data: {
            restaurantId: id,
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
            ...settingsData,
          },
        });
      }

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'restaurant_settings',
          resourceId: updatedSettings.id,
          metadata: {
            restaurantId: id,
            updatedFields: Object.keys(settingsData),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedSettings,
      });
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      return NextResponse.json(
        { error: 'Failed to update restaurant settings' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);