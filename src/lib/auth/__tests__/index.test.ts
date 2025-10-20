import AuthService from '../index'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

// Mock dependencies
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('@/lib/db')

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockedJwt = jwt as jest.Mocked<typeof jwt>
const mockedDb = db as jest.Mocked<typeof db>

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+34600123456'
      }

      mockedDb.users.findByEmail.mockResolvedValue(null)
      mockedBcrypt.hash.mockResolvedValue('hashed-password')
      mockedDb.prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      mockedDb.prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'staff',
        description: 'Staff role',
        permissions: {},
        createdAt: new Date(),
        updatedAt: new Date()
      })
      mockedDb.prisma.userRole.create.mockResolvedValue({} as any)
      mockedDb.prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        isEmailVerified: false,
        roles: [{
          role: {
            id: 'role-1',
            name: 'staff',
            description: 'Staff role',
            permissions: {}
          }
        }]
      })
      mockedJwt.sign.mockReturnValue('mock-token')

      // Act
      const result = await AuthService.register(userData)

      // Assert
      expect(result.user.email).toBe(userData.email)
      expect(result.user.firstName).toBe(userData.firstName)
      expect(result.user.lastName).toBe(userData.lastName)
      expect(result.token).toBe('mock-token')
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10)
      expect(mockedDb.prisma.user.create).toHaveBeenCalled()
    })

    it('should throw error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }

      mockedDb.users.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: userData.email
      } as any)

      // Act & Assert
      await expect(AuthService.register(userData)).rejects.toThrow('User with this email already exists')
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const user = {
        id: 'user-1',
        email: credentials.email,
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [{
          role: {
            id: 'role-1',
            name: 'staff',
            description: 'Staff role',
            permissions: {}
          }
        }]
      }

      mockedDb.prisma.user.findUnique.mockResolvedValue(user as any)
      mockedBcrypt.compare.mockResolvedValue(true)
      mockedJwt.sign.mockReturnValue('mock-token')
      mockedDb.prisma.userSession.create.mockResolvedValue({} as any)
      mockedDb.prisma.user.update.mockResolvedValue({} as any)

      // Act
      const result = await AuthService.login(credentials)

      // Assert
      expect(result.user.email).toBe(credentials.email)
      expect(result.token).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-token')
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(credentials.password, 'hashed-password')
      expect(mockedDb.prisma.userSession.create).toHaveBeenCalled()
    })

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockedDb.prisma.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials')
    })

    it('should throw error for inactive user', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const user = {
        id: 'user-1',
        email: credentials.email,
        password: 'hashed-password',
        isActive: false
      }

      mockedDb.prisma.user.findUnique.mockResolvedValue(user as any)

      // Act & Assert
      await expect(AuthService.login(credentials)).rejects.toThrow('Account is disabled')
    })

    it('should throw error for wrong password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const user = {
        id: 'user-1',
        email: credentials.email,
        password: 'hashed-password',
        isActive: true
      }

      mockedDb.prisma.user.findUnique.mockResolvedValue(user as any)
      mockedBcrypt.compare.mockResolvedValue(false)

      // Act & Assert
      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const token = 'mock-token'
      mockedDb.prisma.userSession.deleteMany.mockResolvedValue({ count: 1 } as any)

      // Act
      await AuthService.logout(token)

      // Assert
      expect(mockedDb.prisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { token }
      })
    })
  })

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      // Arrange
      const token = 'mock-token'
      const payload = {
        userId: 'user-1',
        email: 'test@example.com',
        roles: ['staff']
      }

      mockedJwt.verify.mockReturnValue(payload)

      // Act
      const result = AuthService.verifyToken(token)

      // Assert
      expect(result).toEqual(payload)
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET || 'fallback-secret')
    })

    it('should throw error for invalid token', () => {
      // Arrange
      const token = 'invalid-token'
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act & Assert
      expect(() => AuthService.verifyToken(token)).toThrow('Invalid token')
    })
  })

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      // Arrange
      const userId = 'user-1'
      const user = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [{
          role: {
            id: 'role-1',
            name: 'staff',
            description: 'Staff role',
            permissions: {}
          }
        }]
      }

      mockedDb.prisma.user.findUnique.mockResolvedValue(user as any)

      // Act
      const result = await AuthService.getUserById(userId)

      // Assert
      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [{
          id: 'role-1',
          name: 'staff',
          description: 'Staff role',
          permissions: {}
        }]
      })
    })

    it('should return null for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user'
      mockedDb.prisma.user.findUnique.mockResolvedValue(null)

      // Act
      const result = await AuthService.getUserById(userId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 'user-1'
      const currentPassword = 'current-password'
      const newPassword = 'new-password'

      const user = {
        id: userId,
        password: 'hashed-current-password'
      }

      mockedDb.users.findById.mockResolvedValue(user as any)
      mockedBcrypt.compare.mockResolvedValue(true)
      mockedBcrypt.hash.mockResolvedValue('hashed-new-password')
      mockedDb.users.update.mockResolvedValue({} as any)
      mockedDb.prisma.userSession.updateMany.mockResolvedValue({ count: 1 } as any)

      // Act
      await AuthService.changePassword(userId, currentPassword, newPassword)

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(currentPassword, 'hashed-current-password')
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
      expect(mockedDb.users.update).toHaveBeenCalledWith(userId, { password: 'hashed-new-password' })
      expect(mockedDb.prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isActive: false }
      })
    })

    it('should throw error for wrong current password', async () => {
      // Arrange
      const userId = 'user-1'
      const currentPassword = 'wrong-password'
      const newPassword = 'new-password'

      const user = {
        id: userId,
        password: 'hashed-current-password'
      }

      mockedDb.users.findById.mockResolvedValue(user as any)
      mockedBcrypt.compare.mockResolvedValue(false)

      // Act & Assert
      await expect(AuthService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow('Current password is incorrect')
    })
  })

  describe('hasRole', () => {
    it('should return true if user has the role', () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [
          { id: 'role-1', name: 'staff', description: 'Staff role' },
          { id: 'role-2', name: 'manager', description: 'Manager role' }
        ]
      }

      // Act
      const result = AuthService.hasRole(user as any, 'staff')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false if user does not have the role', () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [
          { id: 'role-1', name: 'staff', description: 'Staff role' }
        ]
      }

      // Act
      const result = AuthService.hasRole(user as any, 'admin')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should return true if user is admin', () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [
          { id: 'role-1', name: 'admin', description: 'Admin role' }
        ]
      }

      // Act
      const result = AuthService.hasPermission(user as any, 'any-permission')

      // Assert
      expect(result).toBe(true)
    })

    it('should return true if user has the permission', () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [
          {
            id: 'role-1',
            name: 'staff',
            description: 'Staff role',
            permissions: {
              reservations: ['read', 'write']
            }
          }
        ]
      }

      // Act
      const result = AuthService.hasPermission(user as any, 'read')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false if user does not have the permission', () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [
          {
            id: 'role-1',
            name: 'staff',
            description: 'Staff role',
            permissions: {
              reservations: ['read']
            }
          }
        ]
      }

      // Act
      const result = AuthService.hasPermission(user as any, 'delete')

      // Assert
      expect(result).toBe(false)
    })
  })
})