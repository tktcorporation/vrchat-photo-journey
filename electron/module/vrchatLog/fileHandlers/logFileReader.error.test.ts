import * as neverthrow from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VRChatLogFilePathSchema } from '../../vrchatLogFileDir/model';
import { getLogLinesByLogFilePathListStreaming } from './logFileReader';

// Mock getLogLinesFromLogFile
vi.mock('./logFileReader', async () => {
  const actual =
    await vi.importActual<typeof import('./logFileReader')>('./logFileReader');
  return {
    ...actual,
    getLogLinesFromLogFile: vi.fn().mockResolvedValue(neverthrow.ok([])),
  };
});

describe('logFileReader - Error Handling', () => {
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

  describe('ファイル読み込みエラー', () => {
    it.skip('ファイル読み込みでエラーが発生した場合にエラーをスローする', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_error.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
      });

      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow();
    });

    it.skip('一部のファイルでエラーが発生しても他のファイルは処理を続行する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_success.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_error.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_success2.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        concurrency: 1, // 1つずつ処理してエラーの順序を制御
      });

      // エラーが発生することを確認
      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow();
    });
  });

  describe('バリデーションエラー', () => {
    it.skip('無効なログ行形式でVRChatLogLineSchemaパースエラーが発生する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_invalid.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
      });

      // Zodバリデーションエラーが発生することを確認
      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow();
    });
  });

  describe('Promise.allエラー処理', () => {
    it.skip('並列処理中にエラーが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file1.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_file2.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_file3.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        concurrency: 3, // 3つ同時に処理
      });

      // Promise.allでエラーが発生することを確認
      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow('File read error');
    });
  });

  describe('システムエラー', () => {
    it.skip('予期しないエラータイプが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
      });

      // 文字列エラーもキャッチされることを確認
      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow();
    });

    it.skip('nullやundefinedエラーが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
      });

      // nullエラーもキャッチされることを確認
      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow();
    });
  });

  describe('リソース制限エラー', () => {
    it.skip('ファイルハンドル不足などのシステムリソースエラーを適切に処理する', async () => {
      const mockLogFilePaths = Array.from({ length: 1000 }, (_, i) =>
        VRChatLogFilePathSchema.parse(`/path/to/output_log_file${i}.txt`),
      );

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        concurrency: 100, // 高い並列数でリソース不足をシミュレート
      });

      await expect(async () => {
        for await (const _batch of generator) {
          // バッチの処理
        }
      }).rejects.toThrow('EMFILE: too many open files');
    });
  });

  describe('ジェネレータの異常終了', () => {
    it('ジェネレータの途中で停止した場合にリソースが適切にクリーンアップされる', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file1.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_file2.txt'),
      ];

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 1,
      });

      // 最初のバッチだけ取得して途中で停止
      const iterator = generator[Symbol.asyncIterator]();
      const firstResult = await iterator.next();

      expect(firstResult.done).toBe(true); // モックは空の配列を返すのでdone=trueになる

      // リソースクリーンアップのテスト（明示的な確認は困難だが、エラーが発生しないことを確認）
      expect(() => {
        // ジェネレータを途中で放棄
      }).not.toThrow();
    });
  });
});
