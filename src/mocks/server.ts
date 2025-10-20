import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { mockUsers, mockReservations, mockRestaurants, mockTables, mockCustomers } from './data'

// Define API handlers
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any
    
    if (email === 'admin@test.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          user: mockUsers[0],
          token: 'mock-jwt-token',
        })
      )
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    )
  }),
  
  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        user: mockUsers[0],
        token: 'mock-jwt-token',
      })
    )
  }),
  
  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.includes('Bearer mock-jwt-token')) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      )
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: mockUsers[0],
      })
    )
  }),
  
  // Reservations endpoints
  rest.get('/api/reservations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockReservations,
        pagination: {
          page: 1,
          limit: 10,
          total: mockReservations.length,
          pages: 1,
        },
      })
    )
  }),
  
  rest.post('/api/reservations', (req, res, ctx) => {
    const newReservation = req.body as any
    const reservation = {
      id: 'new-reservation-id',
      ...newReservation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: reservation,
      })
    )
  }),
  
  rest.get('/api/reservations/:id', (req, res, ctx) => {
    const { id } = req.params
    const reservation = mockReservations.find(r => r.id === id)
    
    if (!reservation) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Reservation not found' })
      )
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: reservation,
      })
    )
  }),
  
  // Restaurants endpoints
  rest.get('/api/restaurants', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockRestaurants,
      })
    )
  }),
  
  rest.post('/api/restaurants', (req, res, ctx) => {
    const newRestaurant = req.body as any
    const restaurant = {
      id: 'new-restaurant-id',
      ...newRestaurant,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: restaurant,
      })
    )
  }),
  
  // Tables endpoints
  rest.get('/api/tables', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockTables,
      })
    )
  }),
  
  rest.post('/api/tables', (req, res, ctx) => {
    const newTable = req.body as any
    const table = {
      id: 'new-table-id',
      ...newTable,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: table,
      })
    )
  }),
  
  // Customers endpoints
  rest.get('/api/customers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockCustomers,
      })
    )
  }),
  
  rest.post('/api/customers', (req, res, ctx) => {
    const newCustomer = req.body as any
    const customer = {
      id: 'new-customer-id',
      ...newCustomer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: customer,
      })
    )
  }),
  
  // Analytics endpoints
  rest.get('/api/analytics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          totalReservations: 150,
          totalRevenue: 12500,
          occupancyRate: 0.75,
          averagePartySize: 3.2,
        },
      })
    )
  }),
]

// Setup server
export const server = setupServer(...handlers)