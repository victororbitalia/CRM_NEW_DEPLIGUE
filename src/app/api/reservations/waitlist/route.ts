import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get all waitlist entries with optional filtering
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

      const [waitlistEntries, totalCount] = await Promise.all([
        db.prisma.waitlistEntry.findMany({
          where: whereClause,
          include: {
            customer: true,
            area: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' },
          ],
          skip: offset,
          take: limit,
        }),
        db.prisma.waitlistEntry.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        success: true,
        data: waitlistEntries,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching waitlist entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Add a new entry to the waitlist
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const waitlistData = await request.json();

      // Validate required fields
      const requiredFields = ['customerId', 'partySize', 'date'];
      for (const field of requiredFields) {
        if (!waitlistData[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Parse and validate date
      const waitlistDate = new Date(waitlistData.date);
      if (isNaN(waitlistDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Set expiry date (end of the day)
      const expiresAt = new Date(waitlistDate);
      expiresAt.setHours(23, 59, 59, 999);

      // Calculate priority based on party size and VIP status
      const customer = await db.customers.findById(waitlistData.customerId);
      let priority = waitlistData.priority || 0;
      
      // Increase priority for larger parties
      priority += Math.floor(waitlistData.partySize / 4);
      
      // Increase priority for VIP customers
      if (customer?.isVip) {
        priority += 5;
      }

      // Create waitlist entry
      const waitlistEntry = await db.prisma.waitlistEntry.create({
        data: {
          ...waitlistData,
          date: waitlistDate,
          expiresAt,
          priority,
        },
        include: {
          customer: true,
          area: true,
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'waitlist',
          resourceId: waitlistEntry.id,
          metadata: {
            waitlistId: waitlistEntry.id,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
            partySize: waitlistEntry.partySize,
            date: waitlistEntry.date.toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: waitlistEntry,
      });
    } catch (error) {
      console.error('Error adding waitlist entry:', error);
      return NextResponse.json(
        { error: 'Failed to add waitlist entry' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);