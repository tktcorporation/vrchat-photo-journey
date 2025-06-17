import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockCaptureException = vi.fn();
const mockGetTermsAccepted = vi.fn();

vi.mock('@sentry/electron/main', () => ({
  captureException: mockCaptureException,
}));

vi.mock('../module/settingStore', () => ({
  getSettingStore: vi.fn(() => ({
    getTermsAccepted: mockGetTermsAccepted,
  })),
}));

vi.mock('electron-log', () => ({
  default: {
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
  },
}));

vi.mock('electron', () => ({
  app: {
    getPath: () => '/test/logs',
    isPackaged: false,
  },
}));

// Import logger after mocking
import { logger } from './logger';

describe('logger Sentry consent integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should not send to Sentry when terms are not accepted', () => {
    mockGetTermsAccepted.mockReturnValue(false);

    logger.error({ message: 'Test error without consent' });

    // Sentryが呼ばれていないことを確認
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('should send to Sentry when terms are accepted', () => {
    mockGetTermsAccepted.mockReturnValue(true);

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
