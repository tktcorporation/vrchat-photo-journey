import type { Page } from '@playwright/test';

export interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  logs: string[];
}

export function setupConsoleCapture(page: Page): ConsoleCapture {
  const consoleCapture: ConsoleCapture = {
    errors: [],
    warnings: [],
    logs: [],
  };

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      consoleCapture.errors.push(text);
      console.error(`🚨 Console Error: ${text}`);
    } else if (type === 'warning') {
      consoleCapture.warnings.push(text);
      console.warn(`⚠️  Console Warning: ${text}`);
    } else if (type === 'log') {
      consoleCapture.logs.push(text);
      console.log(`📝 Console Log: ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    const errorMessage = `[PAGE ERROR] ${error.message}`;
    consoleCapture.errors.push(errorMessage);
    console.error(`💥 Page Error: ${error.message}`);
    console.error(error.stack);
  });

  return consoleCapture;
}

export function reportConsoleCapture(capture: ConsoleCapture): void {
  if (capture.errors.length > 0) {
    console.error(
      `\n❌ Test completed with ${capture.errors.length} console error(s):`,
    );
    capture.errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
  }

  if (capture.warnings.length > 0) {
    console.warn(
      `\n⚠️  Test completed with ${capture.warnings.length} console warning(s):`,
    );
    capture.warnings.forEach((warning, index) => {
      console.warn(`  ${index + 1}. ${warning}`);
    });
  }

  if (capture.errors.length === 0 && capture.warnings.length === 0) {
    console.log('\n✅ Test completed with no console errors or warnings');
  }
}
