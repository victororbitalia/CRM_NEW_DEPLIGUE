import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email } = resendVerificationSchema.parse(body);

    // Resend verification email
    const verificationToken = await AuthService.resendEmailVerification(email);

    // In a real application, you would send an email with the verification link
    // For now, we'll just return the token for testing purposes
    console.log(`Email verification token: ${verificationToken}`);
    console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      // Only include verification token in development
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
    });
  } catch (error) {
    console.error('Resend verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend verification email' },
      { status: 400 }
    );
  }
}