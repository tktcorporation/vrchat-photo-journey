import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockCaptureException = vi.fn();
const mockGetSettingStore = vi.fn();

describe('logger Sentry consent integration', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    // Set up mocks before importing
    vi.doMock('electron', () => ({
      app: {
        getPath: () => '/test/logs',
        isPackaged: false,
      },
    }));

    vi.doMock('@sentry/electron/main', () => ({
      captureException: mockCaptureException,
    }));

    vi.doMock('../module/settingStore', () => ({
      getSettingStore: mockGetSettingStore,
    }));

    vi.doMock('electron-log', () => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      transports: {
        file: {
          resolvePathFn: vi.fn(),
          maxSize: 0,
          level: 'debug',
          format: '',
          getFile: () => ({ path: '/test/path' }),
        },
        console: {
          level: 'debug',
          format: '',
        },
      },
    }));
  });

  it('should not send to Sentry when terms are not accepted', async () => {
    mockGetSettingStore.mockReturnValue({
      getTermsAccepted: () => false,
    });

    // Dynamically import logger after mocks are set
    const { logger } = await import('./logger');

    logger.error({ message: 'Test error without consent' });

    // Sentryが呼ばれていないことを確認
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('should send to Sentry when terms are accepted', async () => {
    mockGetSettingStore.mockReturnValue({
      getTermsAccepted: () => true,
    });

    // Dynamically import logger after mocks are set
    const { logger } = await import('./logger');

    logger.error({ message: 'Test error with consent' });

    // Sentryが呼ばれていることを確認
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: {
          source: 'electron-main',
        },
      }),
    );
  });
});
