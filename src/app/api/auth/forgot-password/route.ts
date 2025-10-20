import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email } = forgotPasswordSchema.parse(body);

    // Generate password reset token
    const resetToken = await AuthService.resetPassword(email);

    // In a real application, you would send an email with the reset link
    // For now, we'll just return the token for testing purposes
    console.log(`Password reset token: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      // Only include reset token in development
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Don't reveal if the email exists or not for security
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, password reset instructions have been sent',
    });
  }
}