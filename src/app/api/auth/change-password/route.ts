import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';
import { withAuthHandler } from '@/lib/auth/middleware';
import { z } from 'zod';

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const POST = withAuthHandler(async (request, { user }) => {
  try {
    const body = await request.json();

    // Validate input
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Change password
    await AuthService.changePassword(user.id, currentPassword, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      { status: 400 }
    );
  }
});