import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get a single customer by ID
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Customer ID is required' },
          { status: 400 }
        );
      }

      const customer = await db.prisma.customer.findUnique({
        where: { id },
        include: {
          reservations: {
            include: {
              table: {
                include: {
                  area: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
          waitlistEntries: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              reservations: true,
              waitlistEntries: true,
            },
          },
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Update a customer
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      const updateData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Customer ID is required' },
          { status: 400 }
        );
      }

      // Check if customer exists
      const existingCustomer = await db.customers.findById(id);
      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== existingCustomer.email) {
        const emailExists = await db.customers.findByEmail(updateData.email);
        if (emailExists) {
          return NextResponse.json(
            { error: 'A customer with this email already exists' },
            { status: 409 }
          );
        }
      }

      // Update customer
      const customer = await db.customers.update(id, updateData);

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'customer',
          resourceId: id,
          metadata: {
            customerId: id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            changes: updateData,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Delete a customer
export const DELETE = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json(
          { error: 'Customer ID is required' },
          { status: 400 }
        );
      }

      // Check if customer exists
      const existingCustomer = await db.customers.findById(id);
      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Check if customer has active reservations
      const activeReservations = await db.prisma.reservation.count({
        where: {
          customerId: id,
          status: {
            in: ['pending', 'confirmed', 'seated'],
          },
        },
      });

      if (activeReservations > 0) {
        return NextResponse.json(
          { error: 'Cannot delete customer with active reservations' },
          { status: 400 }
        );
      }

      // Delete customer
      await db.customers.delete(id);

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'delete',
          resource: 'customer',
          resourceId: id,
          metadata: {
            customerId: id,
            customerName: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);