import { NextRequest, NextResponse } from 'next/server';
import AuthService from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or request body
    const refreshTokenFromCookie = request.cookies.get('refreshToken')?.value;
    const body = await request.json().catch(() => ({}));
    const refreshTokenFromBody = body.refreshToken;
    
    const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Refresh tokens
    const { token, newRefreshToken } = await AuthService.refreshToken(refreshToken);

    // Set new refresh token in cookie
    const response = NextResponse.json({
      success: true,
      token,
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear invalid refresh token cookie
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token refresh failed' },
      { status: 401 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}