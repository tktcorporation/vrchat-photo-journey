import { _electron, test } from '@playwright/test';

test('Hello Worldが表示されること', async () => {
  // Launch Electron app.
  const electronApp = await _electron.launch({
    args: [require.resolve('../main/index.js')],
  });

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath();
  });
  console.log(appPath);

  // Get the first window that the app opens, wait if necessary.
  const page = await electronApp.firstWindow();

  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
  });

  // Print the title.
  console.log(await page.title());
  // Capture a screenshot.
  await page.screenshot({ path: 'intro.png' });
  // Direct Electron console to Node terminal.
  page.on('console', console.log);
  // Click button.
  await page.click('text=設定画面へ');
  // Exit app.
  await electronApp.close();
});
