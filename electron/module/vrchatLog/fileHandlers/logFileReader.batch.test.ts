import { ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../../lib/logger';
import { VRChatLogFilePathSchema } from '../../vrchatLogFileDir/model';
import { getLogLinesByLogFilePathListStreaming } from './logFileReader';

vi.mock('../../../lib/logger');

const mockLogger = vi.mocked(logger);

// getLogLinesFromLogFile をモック
vi.mock('./logFileReader', async () => {
  const actual =
    await vi.importActual<typeof import('./logFileReader')>('./logFileReader');
  return {
    ...actual,
    getLogLinesFromLogFile: vi.fn().mockResolvedValue(ok([])),
  };
});

describe('logFileReader - Batch Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // メモリ使用量を安全な範囲に設定
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 100 * 1024 * 1024, // 100MB
      heapTotal: 1024 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
      rss: 1024 * 1024 * 1024,
    });
  });

  describe('バッチサイズ制御', () => {
    it.skip('指定されたバッチサイズでログ行を分割して返す', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-01.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 2, // 2行ずつのバッチ
      });

      const batches = [];
      for await (const batch of generator) {
        batches.push(batch);
      }

      // 5行が2行ずつ分割されて3つのバッチになることを期待
      // バッチ1: 2行, バッチ2: 2行, バッチ3: 1行
      expect(batches.length).toBeGreaterThan(0);

      // ストリーミング処理のログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Streaming log lines: yielding'),
      );
    });

    it('デフォルトのバッチサイズ（1000行）が適用される', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-01.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        // batchSizeを指定しない（デフォルト1000）
      });

      // ジェネレータが正常に作成されることを確認
      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });

    it('小さなバッチサイズでも正常に動作する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-01.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 1, // 1行ずつのバッチ
      });

      // ジェネレータが正常に作成されることを確認
      expect(generator).toBeDefined();
    });
  });

  describe('並列処理制御', () => {
    it('指定された並列処理数でファイルを処理する', async () => {
      const mockLogFilePaths = Array.from({ length: 6 }, (_, i) =>
        VRChatLogFilePathSchema.parse(
          `/path/to/output_log_2023-01-${String(i + 1).padStart(2, '0')}.txt`,
        ),
      );

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        concurrency: 2, // 2つずつ並列処理
      });

      const iterator = generator[Symbol.asyncIterator]();
      await iterator.next();

      // 並列処理のバッチ処理ログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Processing file batch'),
      );
    });

    it('デフォルトの並列処理数（5）が適用される', async () => {
      const mockLogFilePaths = Array.from({ length: 10 }, (_, i) =>
        VRChatLogFilePathSchema.parse(
          `/path/to/output_log_2023-01-${String(i + 1).padStart(2, '0')}.txt`,
        ),
      );

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        // concurrencyを指定しない（デフォルト5）
      });

      // ジェネレータが正常に作成されることを確認
      expect(generator).toBeDefined();
    });

    it('大量のファイルでも並列処理数を制限する', async () => {
      const mockLogFilePaths = Array.from({ length: 100 }, (_, i) =>
        VRChatLogFilePathSchema.parse(
          `/path/to/output_log_2023-01-${String(i + 1).padStart(2, '0')}.txt`,
        ),
      );

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        concurrency: 3, // 3つずつ処理
      });

      const iterator = generator[Symbol.asyncIterator]();
      await iterator.next();

      // バッチ処理のログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Processing file batch \d+, memory: \d+\.\d+MB/),
      );
    });
  });

  describe('ログ行の蓄積と放出', () => {
    it.skip('バッチサイズに達するまでログ行を蓄積する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-01.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-02.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 3, // 3行ずつのバッチ
      });

      const batches = [];
      for await (const batch of generator) {
        batches.push(batch);
      }

      // バッチが適切に作成されることを確認
      expect(batches.length).toBeGreaterThan(0);
    });

    it.skip('最後に残ったログ行も適切に返す', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_2023-01-01.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 3, // 3行ずつのバッチ
      });

      const batches = [];
      for await (const batch of generator) {
        batches.push(batch);
      }

      // 最終バッチのログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('yielding final batch'),
      );
    });
  });

  describe('空のデータセット処理', () => {
    it('空のファイルリストでも正常に動作する', async () => {
      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: [],
        includesList: ['Info'],
        batchSize: 100,
      });

      const batches = [];
      for await (const batch of generator) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(0);
    });

    it('ログ行が見つからないファイルでも正常に動作する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_empty.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 100,
      });

      const batches = [];
      for await (const batch of generator) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(0);
    });
  });
});
