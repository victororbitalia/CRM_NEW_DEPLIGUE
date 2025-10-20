import { NextRequest } from 'next/server'
import { POST } from '../login/route'
import AuthService from '@/lib/auth'

// Mock AuthService
jest.mock('@/lib/auth')
const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login user successfully with valid credentials', async () => {
    // Arrange
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    }

    const mockUser = {
      id: 'user-1',
      email: loginData.email,
      firstName: 'Admin',
      lastName: 'User',
      roles: [
        { id: 'role-1', name: 'admin' }
      ]
    }

    const mockResponse = {
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }

    mockedAuthService.login.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe(loginData.email)
    expect(data.token).toBe('mock-jwt-token')
    expect(mockedAuthService.login).toHaveBeenCalledWith(loginData)
  })

  it('should return 400 when email or password is missing', async () => {
    // Arrange
    const loginData = {
      email: 'admin@test.com'
      // Missing password
    }

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
    expect(mockedAuthService.login).not.toHaveBeenCalled()
  })

  it('should return 401 when credentials are invalid', async () => {
    // Arrange
    const loginData = {
      email: 'admin@test.com',
      password: 'wrongpassword'
    }

    mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid credentials')
    expect(mockedAuthService.login).toHaveBeenCalledWith(loginData)
  })

  it('should return 401 when account is disabled', async () => {
    // Arrange
    const loginData = {
      email: 'disabled@test.com',
      password: 'password123'
    }

    mockedAuthService.login.mockRejectedValue(new Error('Account is disabled'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Account is disabled')
    expect(mockedAuthService.login).toHaveBeenCalledWith(loginData)
  })

  it('should set refresh token cookie', async () => {
    // Arrange
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    }

    const mockResponse = {
      user: {
        id: 'user-1',
        email: loginData.email,
        firstName: 'Admin',
        lastName: 'User',
        roles: [
          { id: 'role-1', name: 'admin' }
        ]
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }

    mockedAuthService.login.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)

    // Assert
    const cookies = response.cookies.get('refreshToken')
    expect(cookies).toBeDefined()
    expect(cookies?.value).toBe('mock-refresh-token')
    expect(cookies?.httpOnly).toBe(true)
    expect(cookies?.sameSite).toBe('strict')
    expect(cookies?.path).toBe('/')
  })

  it('should handle malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBeDefined()
    expect(mockedAuthService.login).not.toHaveBeenCalled()
  })

  it('should handle unexpected errors', async () => {
    // Arrange
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    }

    mockedAuthService.login.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Database connection failed')
    expect(mockedAuthService.login).toHaveBeenCalledWith(loginData)
  })
})