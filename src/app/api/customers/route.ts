import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get all customers with optional filtering
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const isVip = searchParams.get('isVip');
      const isBlacklisted = searchParams.get('isBlacklisted');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      let whereClause: any = {};

      // Search by name, email, or phone
      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by VIP status
      if (isVip !== null) {
        whereClause.isVip = isVip === 'true';
      }

      // Filter by blacklist status
      if (isBlacklisted !== null) {
        whereClause.isBlacklisted = isBlacklisted === 'true';
      }

      const [customers, totalCount] = await Promise.all([
        db.prisma.customer.findMany({
          where: whereClause,
          include: {
            reservations: {
              orderBy: {
                date: 'desc',
              },
              take: 5, // Only include recent reservations
            },
            _count: {
              select: {
                reservations: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        }),
        db.prisma.customer.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        success: true,
        data: customers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Create a new customer
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const customerData = await request.json();

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email'];
      for (const field of requiredFields) {
        if (!customerData[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Check if email already exists
      const existingCustomer = await db.customers.findByEmail(customerData.email);
      if (existingCustomer) {
        return NextResponse.json(
          { error: 'A customer with this email already exists' },
          { status: 409 }
        );
      }

      // Create customer
      const customer = await db.customers.create(customerData);

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'customer',
          resourceId: customer.id,
          metadata: {
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);