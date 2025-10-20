import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth';

// DELETE /api/api-tokens/[id] - Revoke an API token
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if the token exists and belongs to the user using raw SQL
    const existingToken = await db.prisma.$queryRaw`
      SELECT id FROM "api_tokens"
      WHERE id = ${params.id} AND "userId" = ${payload.userId} AND "isActive" = true
      LIMIT 1
    `;

    if (!Array.isArray(existingToken) || existingToken.length === 0) {
      return NextResponse.json(
        { error: 'API token not found' },
        { status: 404 }
      );
    }

    // Deactivate the token instead of deleting it (for audit purposes)
    await db.prisma.$queryRaw`
      UPDATE "api_tokens"
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'API token revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke API token' },
      { status: 500 }
    );
  }
}

// PUT /api/api-tokens/[id] - Update an API token (e.g., update last used timestamp)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, permissions, expiresAt } = await request.json();

    // Check if the token exists and belongs to the user using raw SQL
    const existingToken = await db.prisma.$queryRaw`
      SELECT id FROM "api_tokens"
      WHERE id = ${params.id} AND "userId" = ${payload.userId} AND "isActive" = true
      LIMIT 1
    `;

    if (!Array.isArray(existingToken) || existingToken.length === 0) {
      return NextResponse.json(
        { error: 'API token not found' },
        { status: 404 }
      );
    }

    // Update the token using raw SQL
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push(`name = $${updateValues.length + 1}`);
      updateValues.push(name);
    }

    if (permissions) {
      updateFields.push(`permissions = $${updateValues.length + 1}::jsonb`);
      updateValues.push(JSON.stringify(permissions));
    }

    if (expiresAt) {
      updateFields.push(`"expiresAt" = $${updateValues.length + 1}`);
      updateValues.push(new Date(expiresAt));
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id);

    const updateQuery = `
      UPDATE "api_tokens"
      SET ${updateFields.join(', ')}
      WHERE id = $${updateValues.length}
      RETURNING id, name, permissions, "lastUsedAt", "expiresAt", "createdAt"
    `;

    const updatedToken = await db.prisma.$queryRawUnsafe(updateQuery, ...updateValues);
    
    const result = Array.isArray(updatedToken) && updatedToken.length > 0 ? updatedToken[0] : null;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating API token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update API token' },
      { status: 500 }
    );
  }
}