import { vi } from 'vitest';

import * as client from './electron/lib/sequelize';

// Sentryのモック設定
vi.mock('@sentry/electron/main', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

afterAll(async () => {
  await client.__cleanupTestRDBClient();
});

// electronモジュールのモック
vi.mock('electron', () => {
  const mockApp = {
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    quit: vi.fn(),
  };

  const mockIpcMain = {
    handle: vi.fn(),
    on: vi.fn(),
  };

  const mockIpcRenderer = {
    invoke: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
  };

  const mockDialog = {
    showOpenDialog: vi.fn(),
  };

  const mockBrowserWindow = vi.fn();

  // CommonJSモジュールとしてエクスポート
  const mock = {
    default: {
      app: mockApp,
      ipcMain: mockIpcMain,
      ipcRenderer: mockIpcRenderer,
      BrowserWindow: mockBrowserWindow,
      dialog: mockDialog,
    },
    app: mockApp,
    ipcMain: mockIpcMain,
    ipcRenderer: mockIpcRenderer,
    BrowserWindow: mockBrowserWindow,
    dialog: mockDialog,
  };

  return mock;
});
