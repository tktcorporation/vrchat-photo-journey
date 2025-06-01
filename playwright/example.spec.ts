import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Page, _electron, test } from '@playwright/test';
import consola from 'consola';

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

const screenshotPath = (title: string, suffix: string) => {
  return path.join(__dirname, './previews', `${title}-${suffix}.png`);
};

const screenshot = async (page: Page, title: string, suffix: string) => {
  await page.screenshot({ path: screenshotPath(title, suffix) });
  const now = new Date().toISOString().split('T')[1].split('.')[0];
  consola.log(`[${now}]: screenshot: ${screenshotPath(title, suffix)}`);
};

const TIMEOUT = 10000;

test(
  '各画面でスクショ',
  async () => {
    // Launch Electron app.
    const electronApp = await launchElectronApp();

    // Get the first window that the app opens, wait if necessary.
    const page = await electronApp.firstWindow();

    const title = await page.title();

    // Print the title.
    console.log(title);

    // await page.evaluate((routerPath) => {
    //   window.history.pushState({}, '', routerPath);
    //   window.location.href = `#${routerPath}`;
    // }, routerPath);

    // 4s以内に処理が終わらなければエラー
    const timeoutDecreaseTwo = TIMEOUT - 2000;
    Promise.race([
      new Promise((resolve) => setTimeout(resolve, timeoutDecreaseTwo)),
      new Promise((_resolve) => {
        setTimeout(async () => {
          await screenshot(page, title, 'timeout');
          throw new Error('Timeout');
        }, timeoutDecreaseTwo);
      }),
    ]);

    await screenshot(page, title, 'initial');

    // 「同意する」が表示されればクリック、表示されなければ次へ進む
    await page.waitForTimeout(500);
    const isTermsButtonVisible = await page.isVisible('text=同意する');
    if (isTermsButtonVisible) {
      await screenshot(page, title, 'terms');
      await page.click('text=同意する');
    } else {
      consola.log('「同意する」ボタンが表示されていません');
    }

    await page.waitForSelector('text=初期セットアップ');
    await screenshot(page, title, 'setup');

    // aria-label="ログファイルを選択" のボタンをクリック
    const logFileInput = await page.waitForSelector(
      '[aria-label="input-VRChatログファイルディレクトリ"]',
    );
    await logFileInput.click();
    // まず全部消す
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    // パスを入力
    await page.keyboard.type(path.join(__dirname, '../debug/logs'));
    const submitButton = await page.waitForSelector(
      '[aria-label="送信-VRChatログファイルディレクトリ"]',
    );
    await submitButton.click();

    const 設定を確認して続けるButton = await page.waitForSelector(
      'text=設定を確認して続ける',
    );
    await 設定を確認して続けるButton.click();

    // 最後の状態をスクショ
    await screenshot(page, title, 'finalized');

    // Exit app.
    await electronApp.close();
  },
  {
    timeout: TIMEOUT,
  },
);
