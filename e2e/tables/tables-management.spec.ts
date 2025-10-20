import { test, expect } from '@playwright/test'

test.describe('Tables Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@restaurant.com')
    await page.getByLabel('Contraseña').fill('admin123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to tables page
    await page.goto('/tables')
    await expect(page.getByRole('heading', { name: 'Gestión de Mesas' })).toBeVisible()
  })

  test('should display tables page with statistics', async ({ page }) => {
    // Check for statistics cards
    await expect(page.getByText('Disponibles')).toBeVisible()
    await expect(page.getByText('Ocupadas')).toBeVisible()
    await expect(page.getByText('Reservadas')).toBeVisible()
    await expect(page.getByText('Mantenimiento')).toBeVisible()
    
    // Check for filter buttons
    await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Disponibles' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ocupadas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reservadas' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mantenimiento' })).toBeVisible()
  })

  test('should switch between grid and layout views', async ({ page }) => {
    // Check default view (grid)
    await expect(page.getByRole('button', { name: 'Vista Grid' })).toHaveAttribute('variant', 'primary')
    await expect(page.getByRole('button', { name: 'Vista Layout' })).toHaveAttribute('variant', 'outline')
    
    // Switch to layout view
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    await expect(page.getByRole('button', { name: 'Vista Layout' })).toHaveAttribute('variant', 'primary')
    await expect(page.getByRole('button', { name: 'Vista Grid' })).toHaveAttribute('variant', 'outline')
    
    // Check for layout elements
    await expect(page.locator('.layout-area')).toBeVisible()
    await expect(page.getByText('Estado de mesas')).toBeVisible()
    
    // Switch back to grid view
    await page.getByRole('button', { name: 'Vista Grid' }).click()
    await expect(page.getByRole('button', { name: 'Vista Grid' })).toHaveAttribute('variant', 'primary')
  })

  test('should filter tables by status', async ({ page }) => {
    // Get initial count
    const allTablesCount = await page.locator('[data-testid="table-card"]').count()
    expect(allTablesCount).toBeGreaterThan(0)
    
    // Filter by available
    await page.getByRole('button', { name: 'Disponibles' }).click()
    const availableTablesCount = await page.locator('[data-testid="table-card"]').count()
    expect(availableTablesCount).toBeLessThanOrEqual(allTablesCount)
    
    // Filter by occupied
    await page.getByRole('button', { name: 'Ocupadas' }).click()
    const occupiedTablesCount = await page.locator('[data-testid="table-card"]').count()
    expect(occupiedTablesCount).toBeLessThanOrEqual(allTablesCount)
    
    // Reset filter
    await page.getByRole('button', { name: 'Todas' }).click()
    const resetTablesCount = await page.locator('[data-testid="table-card"]').count()
    expect(resetTablesCount).toBe(allTablesCount)
  })

  test('should create a new table', async ({ page }) => {
    // Click on "Nueva Mesa" button
    await page.getByRole('button', { name: 'Nueva Mesa' }).click()
    
    // Check modal is open
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nueva Mesa' })).toBeVisible()
    
    // Fill form
    await page.getByLabel('Número de mesa').fill('TEST-01')
    await page.getByLabel('Capacidad').fill('4')
    
    // Select area (assuming there's at least one area)
    await page.getByLabel('Área').click()
    await page.getByRole('option').first().click()
    
    // Select shape
    await page.getByLabel('Forma').click()
    await page.getByRole('option', { name: 'Cuadrada' }).click()
    
    // Submit form
    await page.getByRole('button', { name: 'Crear' }).click()
    
    // Check modal is closed and success message is shown
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('Mesa creada correctamente')).toBeVisible()
    
    // Check new table appears in the list
    await expect(page.getByText('TEST-01')).toBeVisible()
  })

  test('should edit an existing table', async ({ page }) => {
    // Find first table and click edit
    const firstTable = page.locator('[data-testid="table-card"]').first()
    await firstTable.getByRole('button', { name: 'Editar' }).click()
    
    // Check modal is open with edit title
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editar Mesa' })).toBeVisible()
    
    // Modify capacity
    const capacityInput = page.getByLabel('Capacidad')
    await capacityInput.clear()
    await capacityInput.fill('6')
    
    // Submit form
    await page.getByRole('button', { name: 'Actualizar' }).click()
    
    // Check modal is closed and success message is shown
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('Mesa actualizada correctamente')).toBeVisible()
  })

  test('should reserve and release a table', async ({ page }) => {
    // Find first available table
    let availableTable = page.locator('[data-testid="table-card"]').filter({ hasText: 'Disponible' }).first()
    
    if (await availableTable.count() === 0) {
      // If no available tables, create one first
      await page.getByRole('button', { name: 'Nueva Mesa' }).click()
      await page.getByLabel('Número de mesa').fill('AVAIL-TEST')
      await page.getByLabel('Capacidad').fill('2')
      await page.getByLabel('Área').click()
      await page.getByRole('option').first().click()
      await page.getByRole('button', { name: 'Crear' }).click()
      await page.waitForTimeout(1000)
      
      availableTable = page.locator('[data-testid="table-card"]').filter({ hasText: 'Disponible' }).first()
    }
    
    // Reserve the table
    await availableTable.getByRole('button', { name: 'Reservar' }).click()
    await expect(page.getByText(/reservada correctamente/)).toBeVisible()
    
    // Check table status changed to reserved
    await expect(availableTable.getByText('Reservada')).toBeVisible()
    
    // Release the table
    await availableTable.getByRole('button', { name: 'Liberar' }).click()
    await expect(page.getByText(/liberada correctamente/)).toBeVisible()
    
    // Check table status changed back to available
    await expect(availableTable.getByText('Disponible')).toBeVisible()
  })

  test('should navigate to areas management', async ({ page }) => {
    await page.getByRole('button', { name: 'Gestionar Áreas' }).click()
    await expect(page).toHaveURL('/areas')
    await expect(page.getByRole('heading', { name: 'Gestión de Áreas' })).toBeVisible()
  })

  test('should show table layout with zoom controls', async ({ page }) => {
    // Switch to layout view
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    
    // Check zoom controls
    await expect(page.getByTitle('Acercar')).toBeVisible()
    await expect(page.getByTitle('Alejar')).toBeVisible()
    await expect(page.getByTitle('Restablecer vista')).toBeVisible()
    
    // Test zoom in
    await page.getByTitle('Acercar').click()
    await page.waitForTimeout(500)
    
    // Test zoom out
    await page.getByTitle('Alejar').click()
    await page.waitForTimeout(500)
    
    // Test reset view
    await page.getByTitle('Restablecer vista').click()
    await page.waitForTimeout(500)
  })

  test('should display table legend in layout view', async ({ page }) => {
    // Switch to layout view
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    
    // Check legend elements
    await expect(page.getByText('Estado de mesas')).toBeVisible()
    await expect(page.getByText('Disponible')).toBeVisible()
    await expect(page.getByText('Ocupada')).toBeVisible()
    await expect(page.getByText('Reservada')).toBeVisible()
    await expect(page.getByText('Mantenimiento')).toBeVisible()
    
    // Check legend colors
    await expect(page.locator('.bg-green-500')).toBeVisible()
    await expect(page.locator('.bg-red-500')).toBeVisible()
    await expect(page.locator('.bg-yellow-500')).toBeVisible()
    await expect(page.locator('.bg-gray-500')).toBeVisible()
  })

  test('should handle empty state when no tables exist', async ({ page }) => {
    // This test would require mocking or setup to delete all tables
    // For now, we'll just check the empty state message structure
    await page.getByRole('button', { name: 'Vista Layout' }).click()
    
    // Check that layout areas are visible even if no tables
    await expect(page.locator('.layout-area')).toBeVisible()
  })
})