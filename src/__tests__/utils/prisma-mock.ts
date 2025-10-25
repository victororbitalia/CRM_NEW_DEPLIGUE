// Mock Prisma Client for testing
import { PrismaClient } from '@prisma/client';

// Create a mock Prisma client
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  reservation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  table: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  area: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  restaurant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  operatingHour: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  restaurantSettings: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  businessRule: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  tableMaintenance: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  waitlistEntry: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  reservationNotification: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activityLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userRole: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
}

// Mock the Prisma Client module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}))

// Export the mock client for use in tests
export { mockPrismaClient }

// Helper functions to set up mock data
export const mockUserFindUnique = (data: any) => {
  mockPrismaClient.user.findUnique.mockResolvedValue(data)
}

export const mockUserFindMany = (data: any[]) => {
  mockPrismaClient.user.findMany.mockResolvedValue(data)
}

export const mockUserCreate = (data: any) => {
  mockPrismaClient.user.create.mockResolvedValue(data)
}

export const mockUserUpdate = (data: any) => {
  mockPrismaClient.user.update.mockResolvedValue(data)
}

export const mockUserDelete = (data: any) => {
  mockPrismaClient.user.delete.mockResolvedValue(data)
}

export const mockCustomerFindUnique = (data: any) => {
  mockPrismaClient.customer.findUnique.mockResolvedValue(data)
}

export const mockCustomerFindMany = (data: any[]) => {
  mockPrismaClient.customer.findMany.mockResolvedValue(data)
}

export const mockCustomerCreate = (data: any) => {
  mockPrismaClient.customer.create.mockResolvedValue(data)
}

export const mockCustomerUpdate = (data: any) => {
  mockPrismaClient.customer.update.mockResolvedValue(data)
}

export const mockCustomerDelete = (data: any) => {
  mockPrismaClient.customer.delete.mockResolvedValue(data)
}

export const mockReservationFindUnique = (data: any) => {
  mockPrismaClient.reservation.findUnique.mockResolvedValue(data)
}

export const mockReservationFindMany = (data: any[]) => {
  mockPrismaClient.reservation.findMany.mockResolvedValue(data)
}

export const mockReservationCreate = (data: any) => {
  mockPrismaClient.reservation.create.mockResolvedValue(data)
}

export const mockReservationUpdate = (data: any) => {
  mockPrismaClient.reservation.update.mockResolvedValue(data)
}

export const mockReservationDelete = (data: any) => {
  mockPrismaClient.reservation.delete.mockResolvedValue(data)
}

export const mockTableFindUnique = (data: any) => {
  mockPrismaClient.table.findUnique.mockResolvedValue(data)
}

export const mockTableFindMany = (data: any[]) => {
  mockPrismaClient.table.findMany.mockResolvedValue(data)
}

export const mockTableCreate = (data: any) => {
  mockPrismaClient.table.create.mockResolvedValue(data)
}

export const mockTableUpdate = (data: any) => {
  mockPrismaClient.table.update.mockResolvedValue(data)
}

export const mockTableDelete = (data: any) => {
  mockPrismaClient.table.delete.mockResolvedValue(data)
}

export const mockRestaurantFindUnique = (data: any) => {
  mockPrismaClient.restaurant.findUnique.mockResolvedValue(data)
}

export const mockRestaurantFindMany = (data: any[]) => {
  mockPrismaClient.restaurant.findMany.mockResolvedValue(data)
}

export const mockRestaurantCreate = (data: any) => {
  mockPrismaClient.restaurant.create.mockResolvedValue(data)
}

export const mockRestaurantUpdate = (data: any) => {
  mockPrismaClient.restaurant.update.mockResolvedValue(data)
}

export const mockRestaurantDelete = (data: any) => {
  mockPrismaClient.restaurant.delete.mockResolvedValue(data)
}

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockPrismaClient).forEach(method => {
    if (typeof method === 'object' && method !== null) {
      Object.values(method).forEach(innerMethod => {
        if (typeof innerMethod === 'function') {
          innerMethod.mockReset()
        }
      })
    } else if (typeof method === 'function') {
      method.mockReset()
    }
  })
}

// Set up default mock implementations
export const setupDefaultMocks = () => {
  // Set up default successful responses
  mockUserFindUnique(null)
  mockUserFindMany([])
  mockCustomerFindUnique(null)
  mockCustomerFindMany([])
  mockReservationFindUnique(null)
  mockReservationFindMany([])
  mockTableFindUnique(null)
  mockTableFindMany([])
  mockRestaurantFindUnique(null)
  mockRestaurantFindMany([])
}