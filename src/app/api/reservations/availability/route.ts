import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Check availability for reservations
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { date, partySize, duration, areaId } = await request.json();

      // Validate required fields
      if (!date || !partySize) {
        return NextResponse.json(
          { error: 'Date and party size are required' },
          { status: 400 }
        );
      }

      const reservationDate = new Date(date);
      if (isNaN(reservationDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Get restaurant settings for default duration
      const restaurant = await db.restaurants.findFirst();
      const restaurantSettings = await db.prisma.restaurantSettings.findFirst({
        where: { restaurantId: restaurant?.id },
      });
      const reservationDuration = duration || restaurantSettings?.defaultReservationDuration || 120; // Default 2 hours

      // Get operating hours for the day
      const dayOfWeek = reservationDate.getDay();
      const operatingHours = await db.prisma.operatingHour.findFirst({
        where: {
          restaurantId: restaurant?.id,
          dayOfWeek,
          isClosed: false,
        },
      });

      if (!operatingHours) {
        return NextResponse.json({
          success: true,
          data: {
            available: false,
            message: 'Restaurant is closed on this day',
            timeSlots: [],
          },
        });
      }

      // Parse operating hours
      const [openHour, openMinute] = operatingHours.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = operatingHours.closeTime.split(':').map(Number);

      const openingTime = new Date(reservationDate);
      openingTime.setHours(openHour, openMinute, 0, 0);

      const closingTime = new Date(reservationDate);
      closingTime.setHours(closeHour, closeMinute, 0, 0);

      // Get all tables that can accommodate the party size
      let tablesQuery: any = {
        where: {
          capacity: { gte: partySize },
          isActive: true,
        },
      };

      if (areaId) {
        tablesQuery.where.areaId = areaId;
      }

      const tables = await db.prisma.table.findMany(tablesQuery);
      
      // Get area information for each table
      const areas = await db.prisma.area.findMany({
        where: {
          id: { in: tables.map(table => table.areaId) },
        },
      });
      
      const tablesWithAreas = tables.map(table => {
        const area = areas.find(a => a.id === table.areaId);
        return {
          ...table,
          area,
        };
      });

      if (tables.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            available: false,
            message: 'No tables available for this party size',
            timeSlots: [],
          },
        });
      }

      // Get existing reservations for the day
      const startOfDay = new Date(reservationDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(reservationDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingReservations = await db.prisma.reservation.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['pending', 'confirmed', 'seated'],
          },
        },
        include: {
          table: true,
        },
      });

      // Generate time slots (every 30 minutes)
      const timeSlots = [];
      const slotDuration = 30; // 30 minutes
      let currentTime = new Date(openingTime);

      while (currentTime < closingTime) {
        const slotEndTime = new Date(currentTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + reservationDuration);

        // Check if this slot is within operating hours
        if (slotEndTime <= closingTime) {
          // Check which tables are available for this time slot
          const availableTables = tablesWithAreas.filter(table => {
            // Check if table has conflicting reservations
            const hasConflict = existingReservations.some(reservation => {
              if (reservation.tableId !== table.id) return false;

              const reservationStart = new Date(reservation.startTime);
              const reservationEnd = new Date(reservation.endTime);

              // Check for overlap
              return (
                (currentTime < reservationEnd && slotEndTime > reservationStart)
              );
            });

            return !hasConflict;
          });

          if (availableTables.length > 0) {
            timeSlots.push({
              time: currentTime.toTimeString().slice(0, 5),
              available: true,
              tables: availableTables.map(table => ({
                id: table.id,
                number: table.number,
                capacity: table.capacity,
                area: table.area?.name || 'Unknown',
              })),
            });
          } else {
            timeSlots.push({
              time: currentTime.toTimeString().slice(0, 5),
              available: false,
              tables: [],
            });
          }
        }

        // Move to next time slot
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }

      // Check if there are any available slots
      const hasAvailability = timeSlots.some(slot => slot.available);

      return NextResponse.json({
        success: true,
        data: {
          available: hasAvailability,
          date: reservationDate.toISOString().split('T')[0],
          partySize,
          duration: reservationDuration,
          operatingHours: {
            open: operatingHours.openTime,
            close: operatingHours.closeTime,
          },
          timeSlots,
        },
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);