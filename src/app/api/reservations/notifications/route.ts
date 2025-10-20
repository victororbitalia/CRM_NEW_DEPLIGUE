import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get all notifications with optional filtering
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const reservationId = searchParams.get('reservationId');
      const type = searchParams.get('type');
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      let whereClause: any = {};

      // Filter by reservation ID
      if (reservationId) {
        whereClause.reservationId = reservationId;
      }

      // Filter by type
      if (type) {
        whereClause.type = type;
      }

      // Filter by status
      if (status) {
        whereClause.status = status;
      }

      const [notifications, totalCount] = await Promise.all([
        db.prisma.reservationNotification.findMany({
          where: whereClause,
          include: {
            reservation: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        }),
        db.prisma.reservationNotification.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Create a new notification
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const notificationData = await request.json();

      // Validate required fields
      const requiredFields = ['reservationId', 'type', 'channel', 'recipient', 'content'];
      for (const field of requiredFields) {
        if (!notificationData[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Check if reservation exists
      const reservation = await db.prisma.reservation.findUnique({
        where: { id: notificationData.reservationId },
        include: { customer: true },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }

      // Create notification
      const notification = await db.prisma.reservationNotification.create({
        data: {
          ...notificationData,
          status: 'pending',
        },
        include: {
          reservation: {
            include: {
              customer: true,
            },
          },
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'notification',
          resourceId: notification.id,
          metadata: {
            notificationId: notification.id,
            reservationId: notification.reservationId,
            type: notification.type,
            channel: notification.channel,
          },
        },
      });

      // In a real implementation, this would trigger the actual sending process
      // For now, we'll just mark it as sent after a simulated delay
      setTimeout(async () => {
        try {
          await db.prisma.reservationNotification.update({
            where: { id: notification.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
            },
          });
        } catch (error) {
          console.error('Error updating notification status:', error);
        }
      }, 1000);

      return NextResponse.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);