import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Custom matchers for testing
export const expectElementToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectButtonToBeDisabled = (button: HTMLElement | null) => {
  expect(button).toBeDisabled()
}

export const expectButtonToBeEnabled = (button: HTMLElement | null) => {
  expect(button).toBeEnabled()
}

// Helper functions for form testing
export const fillForm = (form: HTMLElement, data: Record<string, string>) => {
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value === 'true'
      } else {
        input.value = value
      }
    }
  })
}

export const submitForm = (form: HTMLElement) => {
  const submitButton = form.querySelector('[type="submit"]') as HTMLButtonElement
  if (submitButton) {
    submitButton.click()
  }
}

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  isEmailVerified: true,
  roles: [],
  ...overrides,
})

export const createMockReservation = (overrides = {}) => ({
  id: 'test-reservation-id',
  customerId: 'test-customer-id',
  tableId: 'test-table-id',
  date: new Date().toISOString(),
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  partySize: 4,
  status: 'confirmed',
  ...overrides,
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  firstName: 'Test',
  lastName: 'Customer',
  email: 'customer@test.com',
  phone: '+34600123456',
  ...overrides,
})

export const createMockTable = (overrides = {}) => ({
  id: 'test-table-id',
  number: '1',
  capacity: 4,
  minCapacity: 1,
  isActive: true,
  ...overrides,
})

export const createMockRestaurant = (overrides = {}) => ({
  id: 'test-restaurant-id',
  name: 'Test Restaurant',
  address: '123 Test Street',
  city: 'Test City',
  phone: '+34900123456',
  email: 'info@testrestaurant.com',
  isActive: true,
  ...overrides,
})

// Async helpers
export const waitForElementToAppear = async (getElement: () => HTMLElement | null) => {
  return new Promise<void>((resolve) => {
    const checkElement = () => {
      const element = getElement()
      if (element) {
        resolve()
      } else {
        setTimeout(checkElement, 100)
      }
    }
    checkElement()
  })
}

export const waitForTextToAppear = async (getText: () => string | null, expectedText: string) => {
  return new Promise<void>((resolve) => {
    const checkText = () => {
      const text = getText()
      if (text && text.includes(expectedText)) {
        resolve()
      } else {
        setTimeout(checkText, 100)
      }
    }
    checkText()
  })
}

// Mock API responses
export const createMockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

export const createMockErrorResponse = (message: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
})