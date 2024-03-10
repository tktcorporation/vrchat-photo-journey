import * as path from 'node:path';
import { _electron, test } from '@playwright/test';
import { getRoutePathKeyByValue, routerPathValues } from '../src/constants';

const launchElectronApp = async () => {
  // Launch Electron app.
  const electronApp = await _electron.launch({
    args: [require.resolve('../main/index.js')],
  });

  return electronApp;
};

test('ボタンクリックできること', async () => {
  // Launch Electron app.
  const electronApp = await launchElectronApp();

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
  await page.click('text=設定画面へ');

  // TODO: 画面遷移ができていることを確認する

  // Direct Electron console to Node terminal.
  page.on('console', console.log);

  await electronApp.close();
});

test('各画面でスクショ', async () => {
  // Launch Electron app.
  const electronApp = await launchElectronApp();

  // Get the first window that the app opens, wait if necessary.
  const page = await electronApp.firstWindow();

  // Print the title.
  console.log(await page.title());

  for (const routerPath of routerPathValues) {
    await page.evaluate((routerPath) => {
      window.history.pushState({}, '', routerPath);
      window.location.href = `#${routerPath}`;
    }, routerPath);
    const screenshotPath = path.join(
      __dirname,
      './previews',
      `${getRoutePathKeyByValue(routerPath)}.png`,
    );
    await page.screenshot({ path: screenshotPath });
  }

  // Exit app.
  await electronApp.close();
});
