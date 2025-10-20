import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/refresh',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/reservations',
  '/tables',
  '/restaurant',
  '/settings',
  '/admin',
  '/manage-users',
  '/manage-restaurants',
];

// Define routes that require specific roles
const roleBasedRoutes = {
  '/admin': ['admin'],
  '/manage-users': ['admin'],
  '/manage-restaurants': ['admin', 'manager'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const tokenFromCookie = request.cookies.get('auth_token')?.value;
  
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : tokenFromCookie;

  // If no token, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if user has required roles for specific routes
    for (const [route, requiredRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        const userRoles = decoded.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          const url = request.nextUrl.clone();
          url.pathname = '/unauthorized';
          return NextResponse.redirect(url);
        }
      }
    }

    // Token is valid, continue
    return NextResponse.next();
  } catch (error) {
    // Token is invalid, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};