import { test, expect } from '@playwright/test'

test.describe('CRM Restaurant - Smoke Test', () => {
  test('should login and navigate to main features', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login')
    
    // 2. Fill login form with correct credentials
    await page.getByLabel('Email address').fill('admin@restaurant.com')
    await page.getByLabel('Password').fill('admin123')
    
    // 3. Submit login form
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // 4. Wait for dashboard to load (use a more flexible wait)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give extra time for login to complete
    
    // 5. Check we're on a protected page (either dashboard or redirected)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/dashboard')
    
    // 6. Navigate to tables page
    await page.goto('/tables')
    await page.waitForLoadState('networkidle')
    
    // 7. Check tables page loaded (use first() to avoid strict mode violation)
    await expect(page.getByText('Gestión de Mesas').first()).toBeVisible()
    
    // 8. Navigate to reservations page
    await page.goto('/reservations')
    await page.waitForLoadState('networkidle')
    
    // 9. Check reservations page loaded
    await expect(page.getByText('Gestión de Reservas').first()).toBeVisible()
    
    // 10. Navigate to restaurant page
    await page.goto('/restaurant')
    await page.waitForLoadState('networkidle')
    
    // 11. Check restaurant page loaded
    await expect(page.getByText('Restaurante Ejemplo')).toBeVisible()
  })

  test('should display landing page for non-authenticated users', async ({ page }) => {
    // Go to home page
    await page.goto('/')
    
    // Check landing page elements
    await expect(page.getByText('RestoCRM')).toBeVisible()
    await expect(page.getByText('Gestiona tu restaurante con')).toBeVisible()
    
    // Check navigation to login
    await page.getByRole('link', { name: 'Iniciar Sesión' }).click()
    await expect(page.getByLabel('Email address')).toBeVisible()
  })

  test('should show login form validation', async ({ page }) => {
    // Go to login page
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Check for validation errors
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })
})