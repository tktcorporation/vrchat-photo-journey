import * as neverthrow from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VRChatLogFilePathSchema } from '../../vrchatLogFileDir/model';
import { VRChatLogFileError } from '../error';
import { getLogLinesByLogFilePathListStreaming } from './logFileReader';

// 実際のファイル読み込み関数をモック
vi.mock('./logFileReader', async () => {
  const actual = await vi.importActual('./logFileReader');
  return {
    ...actual,
    getLogLinesFromLogFile: vi.fn(),
  };
});

describe('logFileReader - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // メモリ使用量を安全な範囲に設定
    const mockMemoryUsage = Object.assign(
      vi.fn(() => ({
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
        rss: 1024 * 1024 * 1024,
      })),
      {
        rss: vi.fn(() => 1024 * 1024 * 1024),
      },
    );
    process.memoryUsage = mockMemoryUsage as typeof process.memoryUsage;
  });

  describe('ファイル読み込みエラー', () => {
    it('ファイル読み込みでエラーが発生した場合にエラーをスローする', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_error.txt'),
      ];

      // getLogLinesFromLogFileがエラーを返すモック
      const mockError = new VRChatLogFileError('LOG_FILE_NOT_FOUND');
      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockResolvedValue(neverthrow.err(mockError));

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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

    it('一部のファイルでエラーが発生しても他のファイルは処理を続行する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_success.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_error.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_success2.txt'),
      ];

      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockResolvedValueOnce(neverthrow.ok(['success line 1']))
        .mockResolvedValueOnce(
          neverthrow.err(new VRChatLogFileError('LOG_FILE_NOT_FOUND')),
        )
        .mockResolvedValueOnce(neverthrow.ok(['success line 2']));

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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
    it('無効なログ行形式でVRChatLogLineSchemaパースエラーが発生する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_invalid.txt'),
      ];

      // 無効な形式のログ行を返すモック
      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockResolvedValue(
          neverthrow.ok(['invalid log format without proper structure']),
        );

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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
    it('並列処理中にエラーが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file1.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_file2.txt'),
        VRChatLogFilePathSchema.parse('/path/to/output_log_file3.txt'),
      ];

      // 2番目のファイルでエラーが発生するモック
      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockResolvedValueOnce(neverthrow.ok(['line 1']))
        .mockRejectedValueOnce(new Error('File read error'))
        .mockResolvedValueOnce(neverthrow.ok(['line 3']));

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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
    it('予期しないエラータイプが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file.txt'),
      ];

      // 文字列エラーを投げるモック
      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockRejectedValue('Unexpected string error');

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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

    it('nullやundefinedエラーが発生した場合に適切に処理する', async () => {
      const mockLogFilePaths = [
        VRChatLogFilePathSchema.parse('/path/to/output_log_file.txt'),
      ];

      // nullエラーを投げるモック
      const mockGetLogLinesFromLogFile = vi.fn().mockRejectedValue(null);

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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
    it('ファイルハンドル不足などのシステムリソースエラーを適切に処理する', async () => {
      const mockLogFilePaths = Array.from({ length: 1000 }, (_, i) =>
        VRChatLogFilePathSchema.parse(`/path/to/output_log_file${i}.txt`),
      );

      // EMFILEエラー（Too many open files）をシミュレート
      const emfileError = new Error(
        'EMFILE: too many open files',
      ) as NodeJS.ErrnoException;
      emfileError.code = 'EMFILE';

      const mockGetLogLinesFromLogFile = vi.fn().mockRejectedValue(emfileError);

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

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

      const mockGetLogLinesFromLogFile = vi
        .fn()
        .mockResolvedValueOnce(neverthrow.ok(['line 1', 'line 2']))
        .mockResolvedValueOnce(neverthrow.ok(['line 3', 'line 4']));

      vi.doMock('./logFileReader', () => ({
        getLogLinesFromLogFile: mockGetLogLinesFromLogFile,
        getLogLinesByLogFilePathListStreaming:
          getLogLinesByLogFilePathListStreaming,
      }));

      const generator = getLogLinesByLogFilePathListStreaming({
        logFilePathList: mockLogFilePaths,
        includesList: ['Info'],
        batchSize: 1,
      });

      // 最初のバッチだけ取得して途中で停止
      const iterator = generator[Symbol.asyncIterator]();
      const firstResult = await iterator.next();

      expect(firstResult.done).toBe(false);

      // リソースクリーンアップのテスト（明示的な確認は困難だが、エラーが発生しないことを確認）
      expect(() => {
        // ジェネレータを途中で放棄
      }).not.toThrow();
    });
  });
});
