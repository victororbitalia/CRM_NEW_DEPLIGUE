import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Register user
    const { user, token } = await AuthService.register(validatedData);

    // Generate email verification token
    const verificationToken = await AuthService.generateEmailVerificationToken(user.id);

    // In a real application, you would send an email with the verification link
    // For now, we'll just return the token for testing purposes
    console.log(`Email verification token: ${verificationToken}`);
    console.log(`Verification link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map(role => role.name),
        isEmailVerified: user.isEmailVerified,
      },
      token,
      // Only include verification token in development
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    );
  }
}