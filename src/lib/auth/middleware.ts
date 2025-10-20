import { NextRequest, NextResponse } from 'next/server';
import AuthService from './index';
import { verifyApiToken } from '../api-auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

/**
 * Middleware to authenticate API requests
 */
export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[]
): Promise<{ success: boolean; response?: NextResponse; user?: any }> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        ),
      };
    }

    let user: any = null;
    let token: string;

    // Handle different token formats
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      
      try {
        // Try JWT token first
        const payload = AuthService.verifyToken(token);
        user = await AuthService.getUserById(payload.userId);
      } catch (jwtError) {
        // If JWT fails, try API token
        const userId = await verifyApiToken(request);
        if (userId) {
          user = await AuthService.getUserById(userId);
        }
      }
    } else if (authHeader.startsWith('Token ')) {
      token = authHeader.substring(6);
      const userId = await verifyApiToken(request);
      if (userId) {
        user = await AuthService.getUserById(userId);
      }
    } else {
      // Assume the entire header is the token
      token = authHeader;
      const userId = await verifyApiToken(request);
      if (userId) {
        user = await AuthService.getUserById(userId);
      }
    }

    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        ),
      };
    }
    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        ),
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Account is disabled' },
          { status: 401 }
        ),
      };
    }

    // Check if user has required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles.map((role: any) => role.name);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Higher-order function to protect API routes
 */
export function withAuthHandler(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>,
  requiredRoles?: string[]
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await withAuth(request, requiredRoles);
    
    if (!authResult.success) {
      return authResult.response!;
    }

    return handler(request, { user: authResult.user, ...context });
  };
}

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(user: any, resource: string, action: string): boolean {
  const userRoles = user.roles || [];
  
  // Admin has all permissions
  if (userRoles.some((role: any) => role.name === 'admin')) {
    return true;
  }

  // Check permissions in each role
  for (const role of userRoles) {
    if (role.permissions && role.permissions[resource] && role.permissions[resource].includes(action)) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware to check specific permissions
 */
export function withPermission(
  resource: string,
  action: string
) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const authResult = await withAuth(request);
    
    if (!authResult.success) {
      return authResult.response!;
    }

    if (!hasPermission(authResult.user, resource, action)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, { user: authResult.user });
  };
}

export default withAuth;