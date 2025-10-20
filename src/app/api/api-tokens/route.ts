import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { nanoid } from 'nanoid';

// GET /api/api-tokens - Get all API tokens for the current user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    // Get user's API tokens using raw SQL
    const apiTokens = await db.prisma.$queryRaw`
      SELECT id, name, permissions, "lastUsedAt", "expiresAt", "createdAt"
      FROM "api_tokens"
      WHERE "userId" = ${payload.userId} AND "isActive" = true
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({
      success: true,
      data: apiTokens,
    });
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch API tokens' },
      { status: 500 }
    );
  }
}

// POST /api/api-tokens - Create a new API token
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    const { name, permissions, expiresIn } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Token name is required' },
        { status: 400 }
      );
    }

    // Generate API token
    const apiToken = `rest_${nanoid(32)}`;
    
    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          expiresAt = null;
      }
    }

    // Save API token to database using raw SQL
    const result = await db.prisma.$queryRaw`
      INSERT INTO "api_tokens" ("id", "userId", name, token, permissions, "expiresAt", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${payload.userId}, ${name}, ${apiToken}, ${JSON.stringify(permissions || {})}::jsonb, ${expiresAt}, true, NOW(), NOW())
      RETURNING id, name, permissions, "lastUsedAt", "expiresAt", "createdAt"
    `;
    
    const newApiToken = Array.isArray(result) && result.length > 0 ? result[0] : null;
    
    if (!newApiToken) {
      throw new Error('Failed to create API token');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newApiToken,
        token: apiToken, // Only include token in creation response
      },
    });
  } catch (error) {
    console.error('Error creating API token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create API token' },
      { status: 500 }
    );
  }
}