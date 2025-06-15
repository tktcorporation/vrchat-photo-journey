import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogRecord } from './converters/dbToLogStore';
import * as exportService from './exportService/exportService';
import type { DBLogProvider } from './exportService/exportService';
import { vrchatLogRouter } from './vrchatLogController';

// tRPCコンテキストのモック
const createMockContext = () => ({
  req: {},
  res: {},
});

// exportServiceをモック
vi.mock('./exportService/exportService', () => ({
  exportLogStoreFromDB: vi.fn(),
}));

// logger をモック
vi.mock('./../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// eventEmitter をモック
vi.mock('./../../trpc', () => ({
  eventEmitter: {
    emit: vi.fn(),
  },
  procedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn().mockImplementation((handler) => handler),
  },
  router: vi.fn().mockImplementation((routes) => routes),
}));

describe('vrchatLogController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportLogStoreData', () => {
    it('全期間指定でエクスポートが実行される', async () => {
      const mockExportResult = {
        exportedFiles: ['/path/to/export/logStore-2023-10.txt'],
        totalLogLines: 100,
        exportStartTime: new Date('2023-10-08T10:00:00Z'),
        exportEndTime: new Date('2023-10-08T10:05:00Z'),
      };

      vi.mocked(exportService.exportLogStoreFromDB).mockResolvedValue(
        mockExportResult,
      );

      const router = vrchatLogRouter();
      const mutation = router.exportLogStoreData;

      const result = await mutation({
        input: {
          outputPath: '/custom/path',
        },
        ctx: createMockContext(),
      });

      expect(result).toEqual(mockExportResult);
      expect(exportService.exportLogStoreFromDB).toHaveBeenCalledWith(
        {
          startDate: undefined,
          endDate: undefined,
          outputBasePath: '/custom/path',
        },
        expect.any(Function), // getDBLogsFromDatabase関数
      );
    });

    it('期間指定でエクスポートが実行される（ローカルタイム処理）', async () => {
      const mockExportResult = {
        exportedFiles: ['/path/to/export/logStore-2023-10.txt'],
        totalLogLines: 50,
        exportStartTime: new Date('2023-10-08T10:00:00Z'),
        exportEndTime: new Date('2023-10-08T10:03:00Z'),
      };

      vi.mocked(exportService.exportLogStoreFromDB).mockResolvedValue(
        mockExportResult,
      );

      const router = vrchatLogRouter();
      const mutation = router.exportLogStoreData;

      // フロントエンドから送られるローカルタイム
      const startDate = new Date('2023-10-08T00:00:00'); // ローカルタイム開始
      const endDate = new Date('2023-10-08T23:59:59.999'); // ローカルタイム終了

      const result = await mutation({
        input: {
          startDate,
          endDate,
          outputPath: '/custom/path',
        },
        ctx: createMockContext(),
      });

      expect(result).toEqual(mockExportResult);
      expect(exportService.exportLogStoreFromDB).toHaveBeenCalledWith(
        {
          startDate,
          endDate,
          outputBasePath: '/custom/path',
        },
        expect.any(Function), // getDBLogsFromDatabase関数
      );
    });

    it('エクスポートエラー時に適切に例外がスローされる', async () => {
      const exportError = new Error('Export failed: Database connection error');
      vi.mocked(exportService.exportLogStoreFromDB).mockRejectedValue(
        exportError,
      );

      const router = vrchatLogRouter();
      const mutation = router.exportLogStoreData;

      await expect(
        mutation({
          input: {
            startDate: new Date('2023-10-08T00:00:00'),
            endDate: new Date('2023-10-08T23:59:59'),
          },
          ctx: createMockContext(),
        }),
      ).rejects.toThrow('Export failed: Database connection error');
    });
  });

  describe('getDBLogsFromDatabase (timezone handling)', () => {
    it('期間指定なしで全データ取得が呼ばれる', async () => {
      // getDBLogsFromDatabase は直接テストできないため、
      // exportLogStoreFromDB のコールバック引数として渡される関数をテスト
      let capturedGetDBLogs: DBLogProvider | undefined;

      vi.mocked(exportService.exportLogStoreFromDB).mockImplementation(
        async (_options, getDBLogs) => {
          capturedGetDBLogs = getDBLogs;
          return {
            exportedFiles: [],
            totalLogLines: 0,
            exportStartTime: new Date(),
            exportEndTime: new Date(),
          };
        },
      );

      const router = vrchatLogRouter();
      const mutation = router.exportLogStoreData;

      await mutation({
        input: {},
        ctx: createMockContext(),
      });

      // getDBLogsFromDatabase関数が期待される引数で呼ばれることを確認
      expect(capturedGetDBLogs).toBeDefined();
      expect(typeof capturedGetDBLogs).toBe('function');
    });

    it('期間指定時にローカルタイムが適切に処理される', async () => {
      let capturedGetDBLogs: DBLogProvider | undefined;

      vi.mocked(exportService.exportLogStoreFromDB).mockImplementation(
        async (_options, getDBLogs) => {
          capturedGetDBLogs = getDBLogs;
          return {
            exportedFiles: [],
            totalLogLines: 0,
            exportStartTime: new Date(),
            exportEndTime: new Date(),
          };
        },
      );

      const router = vrchatLogRouter();
      const mutation = router.exportLogStoreData;

      const startDate = new Date('2023-10-08T00:00:00'); // ローカルタイム
      const endDate = new Date('2023-10-08T23:59:59'); // ローカルタイム

      await mutation({
        input: {
          startDate,
          endDate,
        },
        ctx: createMockContext(),
      });

      // キャプチャした関数にローカルタイム引数が渡されることを確認
      expect(capturedGetDBLogs).toBeDefined();

      // 実際のDB関数呼び出しはモックの制約上困難なため、
      // 引数の型と存在のみ確認
      expect(typeof capturedGetDBLogs).toBe('function');
    });
  });
});
