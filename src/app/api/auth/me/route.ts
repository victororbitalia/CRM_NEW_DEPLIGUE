import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';
import { withAuthHandler } from '@/lib/auth/middleware';

export const GET = withAuthHandler(async (request, { user }) => {
  try {
    // Get full user details
    const fullUser = await AuthService.getUserById(user.id);
    
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        roles: fullUser.roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })),
        isActive: fullUser.isActive,
        isEmailVerified: fullUser.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
});