import { NextRequest } from 'next/server';
import { db } from './db';

/**
 * Verify API token from request headers
 * @param request The NextRequest object
 * @returns The user ID if token is valid, null otherwise
 */
export async function verifyApiToken(request: NextRequest): Promise<string | null> {
  // Check for API token in Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Handle both Bearer and token formats
  let token: string;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader.startsWith('Token ')) {
    token = authHeader.substring(6);
  } else {
    // Assume the entire header is the token
    token = authHeader;
  }

  if (!token) {
    return null;
  }

  try {
    // Look up the token in the database using raw SQL
    const result = await db.prisma.$queryRaw`
      SELECT t."userId", u."isActive" as user_active
      FROM "api_tokens" t
      JOIN "users" u ON t."userId" = u.id
      WHERE t.token = ${token} 
        AND t."isActive" = true 
        AND (t."expiresAt" IS NULL OR t."expiresAt" > NOW())
      LIMIT 1
    `;

    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }

    const tokenData = result[0] as any;
    
    if (!tokenData.user_active) {
      return null;
    }

    // Update last used timestamp using raw SQL
    await db.prisma.$queryRaw`
      UPDATE "api_tokens"
      SET "lastUsedAt" = NOW()
      WHERE token = ${token}
    `;

    return tokenData.userId;
  } catch (error) {
    console.error('Error verifying API token:', error);
    return null;
  }
}

/**
 * Middleware to protect API routes with JWT or API token authentication
 * @param request The NextRequest object
 * @returns The user ID if authenticated, null otherwise
 */
export async function authenticateApiRequest(request: NextRequest): Promise<string | null> {
  // First try JWT token (for web app)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { AuthService } = await import('./auth');
      const payload = AuthService.verifyToken(token);
      return payload.userId;
    } catch (error) {
      // JWT is invalid, try API token next
    }
  }

  // Try API token authentication
  return await verifyApiToken(request);
}

/**
 * Get user permissions from API token
 * @param request The NextRequest object
 * @returns The permissions object if token is valid, null otherwise
 */
export async function getApiTokenPermissions(request: NextRequest): Promise<any | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  let token: string;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader.startsWith('Token ')) {
    token = authHeader.substring(6);
  } else {
    token = authHeader;
  }

  if (!token) {
    return null;
  }

  try {
    const result = await db.prisma.$queryRaw`
      SELECT permissions
      FROM "api_tokens"
      WHERE token = ${token} 
        AND "isActive" = true 
        AND (t."expiresAt" IS NULL OR t."expiresAt" > NOW())
      LIMIT 1
    `;

    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }

    const tokenData = result[0] as any;
    return tokenData.permissions || null;
  } catch (error) {
    console.error('Error getting API token permissions:', error);
    return null;
  }
}