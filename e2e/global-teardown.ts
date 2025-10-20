import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests');
  
  // Clean up test database if needed
  // This is where you could clean up test data
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;