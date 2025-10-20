import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get a single reservation by ID
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Reservation ID is required' },
          { status: 400 }
        );
      }

      const reservation = await db.prisma.reservation.findUnique({
        where: { id },
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
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          notifications: true,
        },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Error fetching reservation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservation' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Update a reservation
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      const updateData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Reservation ID is required' },
          { status: 400 }
        );
      }

      // Check if reservation exists
      const existingReservation = await db.prisma.reservation.findUnique({
        where: { id },
      });

      if (!existingReservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }

      // Parse and validate dates if provided
      let reservationDate, startTime, endTime;
      
      if (updateData.date) {
        reservationDate = new Date(updateData.date);
        if (isNaN(reservationDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          );
        }
      }

      if (updateData.startTime) {
        startTime = new Date(updateData.startTime);
        if (isNaN(startTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid start time format' },
            { status: 400 }
          );
        }
      }

      if (updateData.endTime) {
        endTime = new Date(updateData.endTime);
        if (isNaN(endTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid end time format' },
            { status: 400 }
          );
        }
      }

      // Check table availability if tableId is being updated
      if (updateData.tableId && updateData.tableId !== existingReservation.tableId) {
        const checkDate = reservationDate || existingReservation.date;
        const checkStartTime = startTime || existingReservation.startTime;
        const checkEndTime = endTime || existingReservation.endTime;

        const conflictingReservation = await db.prisma.reservation.findFirst({
          where: {
            tableId: updateData.tableId,
            date: checkDate,
            status: {
              in: ['pending', 'confirmed', 'seated'],
            },
            id: { not: id }, // Exclude current reservation
            OR: [
              {
                AND: [
                  { startTime: { lte: checkStartTime } },
                  { endTime: { gt: checkStartTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: checkEndTime } },
                  { endTime: { gte: checkEndTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: checkStartTime } },
                  { endTime: { lte: checkEndTime } },
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

      // Prepare update data
      const dataToUpdate: any = {
        ...updateData,
        updatedById: user.id,
      };

      if (reservationDate) dataToUpdate.date = reservationDate;
      if (startTime) dataToUpdate.startTime = startTime;
      if (endTime) dataToUpdate.endTime = endTime;

      // Handle status changes with timestamps
      if (updateData.status && updateData.status !== existingReservation.status) {
        const now = new Date();
        
        switch (updateData.status) {
          case 'confirmed':
            if (!existingReservation.confirmedAt) {
              dataToUpdate.confirmedAt = now;
            }
            break;
          case 'seated':
            if (!existingReservation.seatedAt) {
              dataToUpdate.seatedAt = now;
            }
            break;
          case 'completed':
            if (!existingReservation.completedAt) {
              dataToUpdate.completedAt = now;
            }
            break;
          case 'cancelled':
            if (!existingReservation.cancelledAt) {
              dataToUpdate.cancelledAt = now;
            }
            if (updateData.cancellationReason) {
              dataToUpdate.cancellationReason = updateData.cancellationReason;
            }
            break;
        }
      }

      // Update reservation
      const reservation = await db.prisma.reservation.update({
        where: { id },
        data: dataToUpdate,
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
          updatedBy: {
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
          action: 'update',
          resource: 'reservation',
          resourceId: reservation.id,
          metadata: {
            reservationId: reservation.id,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
            changes: updateData,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Delete a reservation
export const DELETE = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Reservation ID is required' },
          { status: 400 }
        );
      }

      // Check if reservation exists
      const existingReservation = await db.prisma.reservation.findUnique({
        where: { id },
        include: {
          customer: true,
        },
      });

      if (!existingReservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }

      // Delete reservation
      await db.prisma.reservation.delete({
        where: { id },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'delete',
          resource: 'reservation',
          resourceId: id,
          metadata: {
            reservationId: id,
            customerName: existingReservation.customer 
              ? `${existingReservation.customer.firstName} ${existingReservation.customer.lastName}`
              : 'Unknown',
            date: existingReservation.date.toISOString(),
            time: existingReservation.startTime.toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Reservation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting reservation:', error);
      return NextResponse.json(
        { error: 'Failed to delete reservation' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);