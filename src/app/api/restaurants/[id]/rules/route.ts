import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { 
  CreateBusinessRuleData, 
  UpdateBusinessRuleData 
} from '@/types';

// Get all business rules for a restaurant
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

      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const ruleType = searchParams.get('type');

      const businessRules = await db.prisma.businessRule.findMany({
        where: { 
          restaurantId: id,
          ...(includeInactive ? {} : { isActive: true }),
          ...(ruleType ? { ruleType } : {}),
        },
        orderBy: [
          { priority: 'asc' },
          { name: 'asc' }
        ],
      });

      return NextResponse.json({
        success: true,
        data: businessRules,
      });
    } catch (error) {
      console.error('Error fetching business rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business rules' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);

// Create a new business rule
export const POST = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const ruleData: CreateBusinessRuleData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!ruleData.name || ruleData.name.trim() === '') {
        return NextResponse.json(
          { error: 'Rule name is required' },
          { status: 400 }
        );
      }

      if (!ruleData.ruleType || ruleData.ruleType.trim() === '') {
        return NextResponse.json(
          { error: 'Rule type is required' },
          { status: 400 }
        );
      }

      if (!ruleData.conditions || typeof ruleData.conditions !== 'object') {
        return NextResponse.json(
          { error: 'Rule conditions are required' },
          { status: 400 }
        );
      }

      if (!ruleData.actions || typeof ruleData.actions !== 'object') {
        return NextResponse.json(
          { error: 'Rule actions are required' },
          { status: 400 }
        );
      }

      // Validate rule type
      const validRuleTypes = [
        'CANCELLATION_POLICY',
        'NO_SHOW_POLICY',
        'BOOKING_LIMITS',
        'RESERVATION_DURATION',
        'PAYMENT_POLICY',
        'CUSTOM'
      ];

      if (!validRuleTypes.includes(ruleData.ruleType)) {
        return NextResponse.json(
          { error: `Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}` },
          { status: 400 }
        );
      }

      // Check if rule name already exists for this restaurant
      const existingRule = await db.prisma.businessRule.findFirst({
        where: {
          restaurantId: id,
          name: ruleData.name.trim(),
        },
      });

      if (existingRule) {
        return NextResponse.json(
          { error: 'A rule with this name already exists' },
          { status: 409 }
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

      const businessRule = await db.prisma.businessRule.create({
        data: {
          ...ruleData,
          name: ruleData.name.trim(),
          restaurantId: id,
          isActive: ruleData.isActive !== undefined ? ruleData.isActive : true,
          priority: ruleData.priority !== undefined ? ruleData.priority : 0,
        },
      });

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'create',
          resource: 'business_rule',
          resourceId: businessRule.id,
          metadata: {
            restaurantId: id,
            ruleName: businessRule.name,
            ruleType: businessRule.ruleType,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: businessRule,
      });
    } catch (error) {
      console.error('Error creating business rule:', error);
      return NextResponse.json(
        { error: 'Failed to create business rule' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);

// Update multiple business rules (bulk update)
export const PUT = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/')[3]; // Extract restaurant ID from path
      const { rules }: { rules: (UpdateBusinessRuleData & { id: string })[] } = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Restaurant ID is required' },
          { status: 400 }
        );
      }

      if (!rules || !Array.isArray(rules)) {
        return NextResponse.json(
          { error: 'Rules array is required' },
          { status: 400 }
        );
      }

      const results = [];

      for (const ruleData of rules) {
        if (!ruleData.id) {
          return NextResponse.json(
            { error: 'Each rule entry must have an ID' },
            { status: 400 }
          );
        }

        // Validate rule type if provided
        if (ruleData.ruleType) {
          const validRuleTypes = [
            'CANCELLATION_POLICY',
            'NO_SHOW_POLICY',
            'BOOKING_LIMITS',
            'RESERVATION_DURATION',
            'PAYMENT_POLICY',
            'CUSTOM'
          ];

          if (!validRuleTypes.includes(ruleData.ruleType)) {
            return NextResponse.json(
              { error: `Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}` },
              { status: 400 }
            );
          }
        }

        // Validate name if provided
        if (ruleData.name && ruleData.name.trim() === '') {
          return NextResponse.json(
            { error: 'Rule name cannot be empty' },
            { status: 400 }
          );
        }

        // Validate conditions and actions if provided
        if (ruleData.conditions && typeof ruleData.conditions !== 'object') {
          return NextResponse.json(
            { error: 'Rule conditions must be an object' },
            { status: 400 }
          );
        }

        if (ruleData.actions && typeof ruleData.actions !== 'object') {
          return NextResponse.json(
            { error: 'Rule actions must be an object' },
            { status: 400 }
          );
        }

        // Check if the business rule exists and belongs to this restaurant
        const existingRule = await db.prisma.businessRule.findFirst({
          where: {
            id: ruleData.id,
            restaurantId: id,
          },
        });

        if (!existingRule) {
          return NextResponse.json(
            { error: `Business rule with ID ${ruleData.id} not found` },
            { status: 404 }
          );
        }

        // Check if rule name already exists for this restaurant (if name is being updated)
        if (ruleData.name && ruleData.name.trim() !== existingRule.name) {
          const duplicateRule = await db.prisma.businessRule.findFirst({
            where: {
              restaurantId: id,
              name: ruleData.name.trim(),
              id: { not: ruleData.id },
            },
          });

          if (duplicateRule) {
            return NextResponse.json(
              { error: 'A rule with this name already exists' },
              { status: 409 }
            );
          }
        }

        const updateData: UpdateBusinessRuleData = {
          ...ruleData,
          ...(ruleData.name ? { name: ruleData.name.trim() } : {}),
        };

        const updatedRule = await db.prisma.businessRule.update({
          where: { id: ruleData.id },
          data: updateData,
        });

        results.push(updatedRule);
      }

      // Log activity
      await db.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'update',
          resource: 'business_rules',
          resourceId: id,
          metadata: {
            restaurantId: id,
            updatedCount: results.length,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Error updating business rules:', error);
      return NextResponse.json(
        { error: 'Failed to update business rules' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);