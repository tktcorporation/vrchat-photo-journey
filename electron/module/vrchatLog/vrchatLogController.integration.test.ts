import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as neverthrow from 'neverthrow';
import { uuidv7 } from 'uuidv7';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// モジュールレベルのモックを先に定義
vi.mock('../../logSync/service', () => {
  const { ok } = require('neverthrow');
  return {
    LOG_SYNC_MODE: {
      FULL: 'FULL',
      INCREMENTAL: 'INCREMENTAL',
    },
    syncLogs: vi.fn(async (mode) => {
      console.log('[Mock] syncLogs called with mode:', mode);
      return ok({
        createdWorldJoinLogModelList: [],
        createdPlayerJoinLogModelList: [],
        createdPlayerLeaveLogModelList: [],
        createdVRChatPhotoPathModelList: [],
      });
    }),
  };
});

// エクスポートサービスのモック定義
vi.mock('./exportService/exportService', () => {
  const path = require('node:path');
  const fs = require('node:fs');
  return {
    exportLogStoreFromDB: vi
      .fn()
      .mockImplementation(async ({ outputBasePath }) => {
        const exportFolderName = 'vrchat-albums-export_2023-12-01_14-30-45';
        const actualOutputPath = outputBasePath || '/tmp/test-export';
        const exportDir = path.join(actualOutputPath, exportFolderName);
        const monthDir = path.join(exportDir, '2023-11');
        const logFilePath = path.join(monthDir, 'logStore-2023-11.txt');

        // バックアップのテストのためにディレクトリを作成
        fs.mkdirSync(monthDir, { recursive: true });
        fs.writeFileSync(logFilePath, '2023-11-01 10:00:00 Test log line\n');

        console.log('[Mock] exportLogStoreFromDB called with:', {
          outputBasePath,
        });
        console.log('[Mock] Returning exportedFiles:', [logFilePath]);

        return {
          totalLogLines: 1,
          exportedFiles: [logFilePath],
          exportStartTime: new Date('2023-12-01T14:30:00'),
          exportEndTime: new Date('2023-12-01T14:30:45'),
        };
      }),
  };
});

import * as initRDBClient from '../../lib/sequelize';
import { eventEmitter } from '../../trpc';
import * as playerJoinLogService from '../VRChatPlayerJoinLogModel/playerJoinLog.service';
import * as playerLeaveLogService from '../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import { initSettingStore } from '../settingStore';
import * as worldJoinLogService from '../vrchatWorldJoinLog/service';

import { vrchatLogRouter } from './vrchatLogController';

// テスト用のユーザーデータディレクトリを設定
const testUserDataDir = path.join(
  os.tmpdir(),
  `vrchat-albums-test-${uuidv7()}`,
);

// モック設定 - 統合テストでは最小限のモックのみ使用
vi.mock('../../lib/wrappedApp', () => ({
  getAppUserDataPath: vi.fn(() => testUserDataDir),
}));

// ファイルシステム操作のモック（テスト用ディレクトリを使用）
vi.mock('../fileHandlers/logStorageManager', () => {
  const path = require('node:path');
  const fs = require('node:fs');
  const { ok } = require('neverthrow');
  const testUserDataDir = path.join(
    require('node:os').tmpdir(),
    'vrchat-albums-test-logstore',
  );

  return {
    getLogStoreDir: vi.fn(() => path.join(testUserDataDir, 'logStore')),
    initLogStoreDir: vi.fn(),
    appendLoglinesToFile: vi.fn(async ({ logLines }) => {
      console.log(
        '[Mock] appendLoglinesToFile called with',
        logLines.length,
        'lines',
      );
      const logStoreDir = path.join(testUserDataDir, 'logStore');

      if (logLines.length === 0) {
        return ok({ logStoreFilePath: '' });
      }

      const firstLine = logLines[0];
      const yearMonth =
        typeof firstLine === 'string'
          ? firstLine.slice(0, 7)
          : firstLine.value.slice(0, 7);
      const monthDir = path.join(logStoreDir, yearMonth);

      // ディレクトリ作成
      fs.mkdirSync(monthDir, { recursive: true });
      const filePath = path.join(monthDir, `logStore-${yearMonth}.txt`);

      // ファイルに追記
      const content = `${logLines
        .map((line) => (typeof line === 'string' ? line : line.value))
        .join('\n')}\n`;
      fs.appendFileSync(filePath, content);

      return ok({ logStoreFilePath: filePath });
    }),
  };
});

// VRChatログファイルディレクトリのモック（テスト環境では実際のログファイルは存在しない）
vi.mock('../vrchatLogFileDirService/vrchatLogFileDirService', async () => {
  const { ok } = await import('neverthrow');
  return {
    getValidVRChatLogFileDir: vi.fn(async () =>
      ok({ path: '/tmp/mock-vrchat-logs' }),
    ),
    getVRChatLogFilePathList: vi.fn(async () => ok([])),
  };
});

// VRChatログサービスのモック（統合テスト用に最小限の実装）
vi.mock('./service', async (importOriginal) => {
  const original = await importOriginal();
  const { ok } = await import('neverthrow');
  return {
    ...original,
    getLogLinesByLogFilePathList: vi.fn(async () => ok([])),
    filterLogLinesByDate: vi.fn(() => []),
    getVRChatLogFilePaths: vi.fn(async () => ok([])),
  };
});

// loadLogInfoIndexFromVRChatLogのモック（統合テスト用）
vi.mock('../../logInfo/service', async (importOriginal) => {
  const original = await importOriginal();
  const { ok } = await import('neverthrow');
  return {
    ...original,
    loadLogInfoIndexFromVRChatLog: vi.fn(async () => {
      console.log('[Mock] loadLogInfoIndexFromVRChatLog called');
      return ok({
        createdWorldJoinLogModelList: [],
        createdPlayerJoinLogModelList: [],
        createdPlayerLeaveLogModelList: [],
        createdVRChatPhotoPathModelList: [],
      });
    }),
  };
});

describe('vrchatLogController integration - Import and Rollback', () => {
  let _settingStore: ReturnType<typeof initSettingStore>;
  let router: ReturnType<typeof vrchatLogRouter>;
  let caller: ReturnType<ReturnType<typeof vrchatLogRouter>['createCaller']>;
  let logStoreDir: string;
  let backupsDir: string;
  let testExportDir: string;

  beforeAll(async () => {
    // テスト用データベース初期化
    initRDBClient.__initTestRDBClient();
    await initRDBClient.__forceSyncRDBClient();
  }, 10000);

  beforeEach(async () => {
    // 各テストの前にDBをクリーンアップ
    await initRDBClient.__forceSyncRDBClient();

    // 設定ストアとルーター初期化
    _settingStore = initSettingStore();
    router = vrchatLogRouter();
    caller = router.createCaller({ eventEmitter });

    // テスト用ディレクトリ作成
    logStoreDir = path.join(testUserDataDir, 'logStore');
    backupsDir = path.join(testUserDataDir, 'backups');
    testExportDir = path.join(os.tmpdir(), `test-export-${uuidv7()}`);

    await fs.mkdir(logStoreDir, { recursive: true });
    await fs.mkdir(backupsDir, { recursive: true });
    await fs.mkdir(testExportDir, { recursive: true });

    // イベントエミッターのリスナーをクリア
    eventEmitter.removeAllListeners();
  });

  afterEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    await fs.rm(testUserDataDir, { recursive: true, force: true });
    await fs.rm(testExportDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await initRDBClient.__cleanupTestRDBClient();
  });

  const createTestLogStoreFile = async (yearMonth: string, content: string) => {
    const monthDir = path.join(testExportDir, yearMonth);
    await fs.mkdir(monthDir, { recursive: true });
    const filePath = path.join(monthDir, `logStore-${yearMonth}.txt`);
    await fs.writeFile(filePath, content);
    return filePath;
  };

  const createTestWorldJoinLog = async (joinDateTime: Date) => {
    const logs = await worldJoinLogService.createVRChatWorldJoinLogModel([
      {
        logType: 'worldJoin' as const,
        joinDate: joinDateTime,
        worldId: { value: `wrld_${uuidv7()}` },
        worldName: { value: 'Test World' },
        worldInstanceId: { value: '12345' },
      },
    ]);
    return logs[0];
  };

  const createTestPlayerJoinLog = async (joinDateTime: Date) => {
    const logs = await playerJoinLogService.createVRChatPlayerJoinLogModel([
      {
        logType: 'playerJoin' as const,
        playerName: { value: 'TestPlayer' },
        playerId: { value: `usr_${uuidv7()}` },
        joinDate: joinDateTime,
      },
    ]);
    return logs[0];
  };

  describe('Import → Rollback フロー', () => {
    it('logStoreファイルをインポートしてロールバックできる', async () => {
      // 1. 初期データをDBに作成
      const _initialWorldLog = await createTestWorldJoinLog(
        new Date('2023-11-01T10:00:00'),
      );
      const _initialPlayerLog = await createTestPlayerJoinLog(
        new Date('2023-11-01T10:05:00'),
      );

      // 2. インポート用のテストファイルを作成
      const testLogContent = [
        '2023-11-02 15:30:45 Log        -  [Behaviour] Joining or Creating Room: Import Test World',
        '2023-11-02 15:31:00 Log        -  [Behaviour] OnPlayerJoined ImportTestPlayer',
      ].join('\n');
      const testFilePath = await createTestLogStoreFile(
        '2023-11',
        testLogContent,
      );

      // 3. インポート実行
      const importResult = await caller.importLogStoreFiles({
        filePaths: [testFilePath],
      });

      expect(importResult).toBeDefined();
      expect(importResult.success).toBe(true);
      expect(importResult.importedData.totalLines).toBe(2);
      expect(importResult.backup).toBeDefined();

      // 4. インポート後のDB状態を確認
      const worldLogsAfterImport =
        await worldJoinLogService.findVRChatWorldJoinLogList({
          orderByJoinDateTime: 'asc',
        });
      expect(worldLogsAfterImport.length).toBeGreaterThan(1); // 初期データ + インポートデータ

      // 5. バックアップ履歴を取得
      const historyResult = await caller.getImportBackupHistory();

      expect(historyResult).toHaveLength(1);
      expect(historyResult[0].id).toBe(importResult.backup.id);

      // 6. ロールバック実行
      const rollbackResult = await caller.rollbackToBackup({
        backupId: importResult.backup.id,
      });

      expect(rollbackResult.success).toBe(true);

      // 7. ロールバック後のDB状態を確認（インポート前の状態に戻る）
      const worldLogsAfterRollback =
        await worldJoinLogService.findVRChatWorldJoinLogList({
          orderByJoinDateTime: 'asc',
        });

      // インポートしたデータが削除され、バックアップデータが復元されていることを確認
      expect(worldLogsAfterRollback.length).toBeGreaterThanOrEqual(1);

      // バックアップ履歴のステータスが更新されていることを確認
      const updatedHistory = await caller.getImportBackupHistory();

      expect(updatedHistory[0].status).toBe('rolled_back');
    });

    it('ディレクトリをインポートできる', async () => {
      // テスト用のディレクトリ構造を作成
      const subDir = path.join(testExportDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });

      const logContent1 =
        '2023-10-01 10:00:00 Log        -  [Behaviour] Joining or Creating Room: Dir Test World 1\n';
      const logContent2 =
        '2023-11-01 10:00:00 Log        -  [Behaviour] Joining or Creating Room: Dir Test World 2\n';

      await createTestLogStoreFile('2023-10', logContent1);
      await createTestLogStoreFile('2023-11', logContent2);

      // サブディレクトリにもファイルを作成
      const subLogPath = path.join(subDir, 'logStore-2023-12.txt');
      await fs.writeFile(
        subLogPath,
        '2023-12-01 10:00:00 Log        -  [Behaviour] Joining or Creating Room: Sub Dir Test World\n',
      );

      // ディレクトリをインポート
      const importResult = await caller.importLogStoreFiles({
        filePaths: [testExportDir],
      });

      expect(importResult.success).toBe(true);
      expect(importResult.importedData.totalLines).toBe(3); // 3つのファイルから3行
      expect(importResult.importedData.processedFiles).toHaveLength(3);
    });

    it('複数回のインポートとロールバックができる', async () => {
      // 1回目のインポート
      const logContent1 =
        '2023-10-01 10:00:00 Log        -  [Behaviour] Joining or Creating Room: First Import\n';
      const filePath1 = await createTestLogStoreFile('2023-10', logContent1);

      const import1 = await caller.importLogStoreFiles({
        filePaths: [filePath1],
      });

      expect(import1.success).toBe(true);

      // 2回目のインポート
      const logContent2 =
        '2023-11-01 10:00:00 Log        -  [Behaviour] Joining or Creating Room: Second Import\n';
      const filePath2 = await createTestLogStoreFile('2023-11', logContent2);

      const import2 = await caller.importLogStoreFiles({
        filePaths: [filePath2],
      });

      expect(import2.success).toBe(true);

      // バックアップ履歴を確認（2つのバックアップ）
      const history = await caller.getImportBackupHistory();

      expect(history).toHaveLength(2);

      // 最新のバックアップにロールバック
      const rollback1 = await caller.rollbackToBackup({
        backupId: history[0].id,
      });

      expect(rollback1.success).toBe(true);

      // さらに古いバックアップにロールバック
      const rollback2 = await caller.rollbackToBackup({
        backupId: history[1].id,
      });

      expect(rollback2.success).toBe(true);
    });

    it('無効なファイルのインポートはエラーになる', async () => {
      await expect(
        caller.importLogStoreFiles({ filePaths: ['/non/existent/file.txt'] }),
      ).rejects.toThrow(
        'インポート対象のlogStoreファイルが見つかりませんでした',
      );
    });

    it('存在しないバックアップへのロールバックはエラーになる', async () => {
      await expect(
        caller.rollbackToBackup({ backupId: 'non-existent-backup-id' }),
      ).rejects.toThrow('バックアップが見つかりません');
    });
  });

  describe('エクスポートとインポートの往復', () => {
    it('エクスポートしたデータを再インポートできる', async () => {
      // 1. テストデータをDBに作成
      await createTestWorldJoinLog(new Date('2023-10-15T10:00:00'));
      await createTestPlayerJoinLog(new Date('2023-10-15T10:05:00'));

      // エクスポート結果をモック
      const _mockExportedPath = path.join(
        testExportDir,
        'vrchat-albums-export_2023-10-15_10-00-00',
        '2023-10',
        'logStore-2023-10.txt',
      );
      // エクスポート結果を作成する際、モックが自動的に正しいパスを返すのでここでは追加の設定は不要

      // 2. データをエクスポート
      const exportResult = await caller.exportLogStoreData({
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-10-31'),
        outputPath: testExportDir,
      });

      expect(exportResult.exportedFiles.length).toBeGreaterThan(0);

      // 3. DBをクリア
      await initRDBClient.__forceSyncRDBClient();

      // 4. エクスポートしたディレクトリを再インポート
      // エクスポートディレクトリのパスを取得
      const exportedPath = exportResult.exportedFiles[0];
      const exportedDirMatch = exportedPath.match(
        /vrchat-albums-export_[^/\\]+/,
      );
      if (!exportedDirMatch) {
        throw new Error('Export directory not found in path');
      }
      const exportedDirPath = path.join(testExportDir, exportedDirMatch[0]);

      const importResult = await caller.importLogStoreFiles({
        filePaths: [exportedDirPath],
      });

      expect(importResult.success).toBe(true);

      // 5. データが復元されたことを確認
      const restoredWorldLogs =
        await worldJoinLogService.findVRChatWorldJoinLogList({
          orderByJoinDateTime: 'asc',
        });
      expect(restoredWorldLogs.length).toBeGreaterThan(0);
    });
  });
});
