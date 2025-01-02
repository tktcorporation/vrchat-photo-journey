import * as path from 'node:path';
import { _electron, test } from '@playwright/test';

const launchElectronApp = async () => {
  // Launch Electron app.
  const electronApp = await _electron.launch({
    args: [require.resolve('../main/index.js')],
  });

  return electronApp;
};

test('各画面でスクショ', async () => {
  // Launch Electron app.
  const electronApp = await launchElectronApp();

  // Get the first window that the app opens, wait if necessary.
  const page = await electronApp.firstWindow();

  // Print the title.
  console.log(await page.title());

  // await page.evaluate((routerPath) => {
  //   window.history.pushState({}, '', routerPath);
  //   window.location.href = `#${routerPath}`;
  // }, routerPath);
  const screenshotPath = path.join(
    __dirname,
    './previews',
    `${page.title()}.png`,
  );
  await page.screenshot({ path: screenshotPath });

  // Exit app.
  await electronApp.close();
});
