import { type FullConfig, chromium } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  // This runs once before all tests
  console.log('🎭 Playwright console error capture enabled');
}

export default globalSetup;
