import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get all reservations with optional filtering
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date');
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      let whereClause: any = {};

      // Filter by date
      if (date) {
        const filterDate = new Date(date);
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        whereClause.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      // Filter by status
      if (status) {
        whereClause.status = status;
      }

      const [reservations, totalCount] = await Promise.all([
        db.reservations.findMany({
          where: whereClause,
          include: {
            customer: true,
            table: {
              include: {
                area: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
          skip: offset,
          take: limit,
        }),
        db.prisma.reservation.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        success: true,
        data: reservations,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff'] // Roles that can access reservations
);

// Create a new reservation
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const reservationData = await request.json();

      // Validate required fields
      const requiredFields = ['customerId', 'date', 'startTime', 'partySize'];
      for (const field of requiredFields) {
        if (!reservationData[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Parse and validate dates
      const reservationDate = new Date(reservationData.date);
      const startTime = new Date(reservationData.startTime);
      
      if (isNaN(reservationDate.getTime()) || isNaN(startTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date or time format' },
          { status: 400 }
        );
      }

      // Calculate end time based on restaurant settings or default duration
      let endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 120); // Default 2 hours

      if (reservationData.endTime) {
        endTime = new Date(reservationData.endTime);
      }

      // Check table availability if tableId is provided
      if (reservationData.tableId) {
        const conflictingReservation = await db.prisma.reservation.findFirst({
          where: {
            tableId: reservationData.tableId,
            date: reservationDate,
            status: {
              in: ['pending', 'confirmed', 'seated'],
            },
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } },
                ],
              },
            ],
          },
        });

        if (conflictingReservation) {
          return NextResponse.json(
            { error: 'Table is already booked for this time slot' },
            { status: 409 }
          );
        }
      }

      // Create reservation
      const reservation = await db.prisma.reservation.create({
        data: {
          customerId: reservationData.customerId,
          tableId: reservationData.tableId,
          date: reservationDate,
          startTime,
          endTime,
          partySize: reservationData.partySize,
          status: reservationData.status || 'pending',
          specialRequests: reservationData.specialRequests,
          occasion: reservationData.occasion,
          source: reservationData.source || 'manual',
          notes: reservationData.notes,
          depositAmount: reservationData.depositAmount,
          depositPaid: reservationData.depositPaid || false,
          isWaitlist: reservationData.isWaitlist || false,
          createdById: user.id,
        },
        include: {
          customer: true,
          table: {
            include: {
              area: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Get customer info for logging
      const customer = await db.customers.findById(reservation.customerId);
      
      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'reservation',
          resourceId: reservation.id,
          metadata: {
            reservationId: reservation.id,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
            partySize: reservation.partySize,
            date: reservation.date.toISOString(),
            time: reservation.startTime.toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff'] // Roles that can create reservations
);