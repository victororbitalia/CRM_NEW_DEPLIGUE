import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { User, Role } from '@/generated/prisma';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    // Check if user already exists
    const existingUser = await db.users.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with profile
    const user = await db.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        profile: {
          create: {
            timezone: 'Europe/Madrid',
            language: 'es',
          },
        },
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Assign default role (staff)
    const staffRole = await db.prisma.role.findUnique({ where: { name: 'staff' } });
    if (staffRole) {
      await db.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: staffRole.id,
        },
      });
    }

    // Get user with roles
    const userWithRoles = await this.getUserById(user.id);
    if (!userWithRoles) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = this.generateToken(userWithRoles);

    return { user: userWithRoles, token };
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string; refreshToken: string }> {
    const { email, password } = credentials;

    // Find user with roles
    const user = await db.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Format user
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(ur => ur.role),
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };

    // Generate tokens
    const token = this.generateToken(authUser);
    const refreshToken = this.generateRefreshToken(authUser);

    // Save refresh token
    await db.prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + this.parseTimeToMs(this.REFRESH_TOKEN_EXPIRES_IN)),
      },
    });

    // Update last login
    await db.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: authUser, token, refreshToken };
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<void> {
    await db.prisma.userSession.deleteMany({
      where: { token },
    });
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string; newRefreshToken: string }> {
    // Find session
    const session = await db.prisma.userSession.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Format user
    const authUser: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      roles: session.user.roles.map(ur => ur.role),
      isActive: session.user.isActive,
      isEmailVerified: session.user.isEmailVerified,
    };

    // Generate new tokens
    const token = this.generateToken(authUser);
    const newRefreshToken = this.generateRefreshToken(authUser);

    // Update session
    await db.prisma.userSession.update({
      where: { id: session.id },
      data: {
        token,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + this.parseTimeToMs(this.REFRESH_TOKEN_EXPIRES_IN)),
      },
    });

    return { token, newRefreshToken };
  }

  /**
   * Verify token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<AuthUser | null> {
    const user = await db.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(ur => ur.role),
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await db.users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.users.update(userId, { password: hashedPassword });

    // Invalidate all sessions
    await db.prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<string> {
    const user = await db.users.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user.id }, this.JWT_SECRET, { expiresIn: '1h' });

    // Save reset token
    await db.users.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return resetToken;
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      const user = await db.users.findById(payload.userId);

      if (!user || !user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await db.users.update(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      // Invalidate all sessions
      await db.prisma.userSession.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Generate email verification token
   */
  static async generateEmailVerificationToken(userId: string): Promise<string> {
    // Generate verification token
    const verificationToken = jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: '24h' });

    // Save verification token
    await db.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: verificationToken },
    });

    return verificationToken;
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      const user = await db.users.findById(payload.userId);

      if (!user || !user.emailVerificationToken || user.emailVerificationToken !== token) {
        throw new Error('Invalid verification token');
      }

      // Verify email and clear token
      await db.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(email: string): Promise<string> {
    const user = await db.users.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    return this.generateEmailVerificationToken(user.id);
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<any[]> {
    return db.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke all sessions except current one
   */
  static async revokeAllSessions(userId: string, currentToken?: string): Promise<void> {
    await db.prisma.userSession.updateMany({
      where: {
        userId,
        ...(currentToken && { token: { not: currentToken } }),
      },
      data: { isActive: false },
    });
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId: string, userId: string): Promise<void> {
    await db.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: { isActive: false },
    });
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(user: AuthUser, roleName: string): boolean {
    return user.roles.some(role => role.name === roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(user: AuthUser, roleNames: string[]): boolean {
    return roleNames.some(roleName => this.hasRole(user, roleName));
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: AuthUser, permission: string): boolean {
    // Admin has all permissions
    if (this.hasRole(user, 'admin')) {
      return true;
    }

    // Check permissions in each role
    for (const role of user.roles) {
      if (role.permissions && typeof role.permissions === 'object') {
        const permissions = role.permissions as Record<string, string[]>;
        // Check if permission exists in any category
        for (const category in permissions) {
          if (permissions[category].includes(permission)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: AuthUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(role => role.name),
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private static generateRefreshToken(user: AuthUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(role => role.name),
    };

    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * Parse time string to milliseconds
   */
  private static parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/(\d+)([hdwmy])/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default to 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      case 'y': return value * 365 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}

export default AuthService;