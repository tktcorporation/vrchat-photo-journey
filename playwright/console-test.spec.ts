import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron, test } from '@playwright/test';
import {
  reportConsoleCapture,
  setupConsoleCapture,
} from './utils/console-capture';

// ESモジュール環境で__dirnameの代わりに使用
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const launchElectronApp = async () => {
  // Launch Electron app.
  const electronApp = await _electron.launch({
    args: [path.join(__dirname, '../main/index.cjs')],
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: 'true',
      PLAYWRIGHT_STORE_HASH: Date.now().toString(),
    },
  });

  return electronApp;
};

test('Console Error Capture Demo', async () => {
  // Launch Electron app.
  const electronApp = await launchElectronApp();

  // Get the first window that the app opens, wait if necessary.
  const page = await electronApp.firstWindow();

  // Setup console error capturing
  const consoleCapture = setupConsoleCapture(page);

  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Wait a bit to capture initial errors
  await page.waitForTimeout(3000);

  // Exit app.
  await electronApp.close();

  // Report console errors summary
  reportConsoleCapture(consoleCapture);
});
