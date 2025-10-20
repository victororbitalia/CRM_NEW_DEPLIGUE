import { test, expect } from '@playwright/test'

test.describe('Tables Management - Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel('Email address').fill('admin@restaurant.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard')
    
    // Navigate to tables page
    await page.goto('/tables')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display tables page with title and statistics', async ({ page }) => {
    // Check page title
    await expect(page.getByText('Gestión de Mesas')).toBeVisible()
    await expect(page.getByText('Administra las mesas de tu restaurante')).toBeVisible()
    
    // Check for statistics cards (they should exist even if empty)
    await expect(page.locator('text=Disponibles')).toBeVisible()
    await expect(page.locator('text=Ocupadas')).toBeVisible()
    await expect(page.locator('text=Reservadas')).toBeVisible()
    await expect(page.locator('text=Mantenimiento')).toBeVisible()
  })

  test('should switch between grid and layout views', async ({ page }) => {
    // Check that view buttons exist
    const gridButton = page.getByRole('button', { name: 'Vista Grid' })
    const layoutButton = page.getByRole('button', { name: 'Vista Layout' })
    
    await expect(gridButton).toBeVisible()
    await expect(layoutButton).toBeVisible()
    
    // Switch to layout view
    await layoutButton.click()
    await page.waitForTimeout(1000)
    
    // Check for layout elements
    await expect(page.locator('.layout-area')).toBeVisible()
    await expect(page.getByText('Estado de mesas')).toBeVisible()
    
    // Switch back to grid view
    await gridButton.click()
    await page.waitForTimeout(1000)
  })

  test('should display filter buttons', async ({ page }) => {
    // Check for filter buttons
    await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Disponibles' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ocupadas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reservadas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mantenimiento' })).toBeVisible()
  })

  test('should open new table modal', async ({ page }) => {
    // Click on "Nueva Mesa" button
    await page.getByRole('button', { name: 'Nueva Mesa' }).click()
    
    // Check modal is open
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.getByText('Nueva Mesa')).toBeVisible()
    
    // Check form elements exist
    await expect(page.getByLabel('Número de mesa')).toBeVisible()
    await expect(page.getByLabel('Capacidad')).toBeVisible()
    await expect(page.getByLabel('Área')).toBeVisible()
    
    // Close modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('should show zoom controls in layout view', async ({ page }) => {
    // Switch to layout view
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    await page.waitForTimeout(1000)
    
    // Check for zoom controls
    await expect(page.getByTitle('Acercar')).toBeVisible()
    await expect(page.getByTitle('Alejar')).toBeVisible()
    await expect(page.getByTitle('Restablecer vista')).toBeVisible()
  })

  test('should display table legend in layout view', async ({ page }) => {
    // Switch to layout view
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    await page.waitForTimeout(1000)
    
    // Check legend elements
    await expect(page.getByText('Estado de mesas')).toBeVisible()
    await expect(page.getByText('Disponible')).toBeVisible()
    await expect(page.getByText('Ocupada')).toBeVisible()
    await expect(page.getByText('Reservada')).toBeVisible()
    await expect(page.getByText('Mantenimiento')).toBeVisible()
  })

  test('should navigate to areas management', async ({ page }) => {
    await page.getByRole('button', { name: 'Gestionar Áreas' }).click()
    await expect(page).toHaveURL('/areas')
  })

  test('should show table count information', async ({ page }) => {
    // Look for text showing table count
    const tableCountText = page.locator('text=Mostrando')
    await expect(tableCountText).toBeVisible()
  })
})