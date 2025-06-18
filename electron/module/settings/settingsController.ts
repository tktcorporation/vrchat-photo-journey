import type { UpdateCheckResult } from 'electron-updater';
import { P, match } from 'ts-pattern';
import { getWindow } from '../../electronUtil';
import {
  ERROR_CATEGORIES,
  ERROR_CODES,
  UserFacingError,
} from '../../lib/errors';
import { logger } from '../../lib/logger';
import * as sequelizeClient from '../../lib/sequelize';
import * as electronUtilService from '../electronUtil/service';
import { LOG_SYNC_MODE, type LogSyncMode, syncLogs } from '../logSync/service';
import { getSettingStore } from '../settingStore';
import * as vrchatWorldJoinLogService from '../vrchatWorldJoinLog/service';
import { procedure, router as trpcRouter } from './../../trpc';
import * as settingService from './service';

// 初期化処理の重複実行を防ぐためのフラグ
let isInitializing = false;

// 前回の PhotoPath を記録しておくための変数
let lastKnownPhotoPath: string | null = null;

/**
 * PhotoPath の設定が変更されたかどうかを確認する
 * 変更されている場合は写真の再インデックスが必要
 */
const hasPhotoPathChanged = (): boolean => {
  const settingStore = getSettingStore();
  const currentPhotoPath = settingStore.getVRChatPhotoDir();

  if (lastKnownPhotoPath === null) {
    // 初回起動時は記録して変更なしとする
    lastKnownPhotoPath = currentPhotoPath;
    return false;
  }

  const hasChanged = lastKnownPhotoPath !== currentPhotoPath;
  if (hasChanged) {
    logger.info(
      `PhotoPath changed from "${lastKnownPhotoPath}" to "${currentPhotoPath}"`,
    );
    lastKnownPhotoPath = currentPhotoPath;
  }

  return hasChanged;
};

export const settingsRouter = () =>
  trpcRouter({
    getAppVersion: procedure.query(async () => {
      const version = await settingService.getAppVersion();
      return version;
    }),
    forceResetDatabase: procedure.mutation(async () => {
      await sequelizeClient.syncRDBClient({
        checkRequired: false,
      });
    }),
    syncDatabase: procedure.mutation(async () => {
      await sequelizeClient.syncRDBClient();
    }),
    isDatabaseReady: procedure.query(async () => {
      const appVersion = await settingService.getAppVersion();
      return sequelizeClient.checkMigrationRDBClient(appVersion);
    }),
    getAppUpdateInfo: procedure.query(async () => {
      return await settingService.getElectronUpdaterInfo();
    }),
    installUpdate: procedure.mutation(async () => {
      const updateInfo = await settingService.getElectronUpdaterInfo();
      if (!updateInfo.isUpdateAvailable) {
        throw new UserFacingError('アップデートはありません。');
      }
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    checkForUpdates: procedure.query(async () => {
      return await settingService.getElectronUpdaterInfo();
    }),
    installUpdatesAndReload: procedure.mutation(async () => {
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    checkForUpdatesAndReturnResult: procedure.query(
      async (): Promise<{
        isUpdateAvailable: boolean;
        updateInfo: UpdateCheckResult | null;
      }> => {
        const updateInfo = await settingService.getElectronUpdaterInfo();
        return {
          isUpdateAvailable: updateInfo.isUpdateAvailable,
          updateInfo: updateInfo.updateInfo,
        };
      },
    ),
    installUpdatesAndReloadApp: procedure.mutation(async () => {
      await settingService.installUpdate();
      const mainWindow = getWindow();
      if (mainWindow) {
        mainWindow.reload();
      }
    }),
    openApplicationLogInExploler: procedure.mutation(async () => {
      const logPath = electronUtilService.getApplicationLogPath();
      logger.debug('openApplicationLogInExploler', logPath);
      await electronUtilService.openPathInExplorer(logPath);
    }),
    throwErrorForSentryTest: procedure.mutation(async () => {
      logger.debug('Throwing test error for Sentry integration');
      const sentryTestError = new Error(
        'This is a test error for Sentry integration.',
      );
      sentryTestError.name = 'SentryTestError';
      Object.defineProperty(sentryTestError, 'additionalInfo', {
        enumerable: true,
        value: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          testProperty: 'This is a test property',
        },
      });
      throw sentryTestError;
    }),

    /**
     * アプリケーション起動時の完全な初期化処理を実行する。
     * データベース初期化、同期、ログ同期まで順次実行される。
     */
    initializeAppData: procedure.mutation(async () => {
      // 重複実行をチェック
      if (isInitializing) {
        logger.debug(
          'Initialization already in progress, skipping duplicate request',
        );
        // Sentryに送信しないよう、debugレベルでログ記録
        return { success: false, message: '初期化処理が既に実行中です' };
      }

      isInitializing = true;

      try {
        logger.info('=== Starting application data initialization ===');

        // Step 0: 旧アプリからのデータ移行チェック（ユーザー確認待ちのため実行はしない）
        logger.debug('Step 0: Checking for data migration from old app...');
        const migrationModule = await import('../migration/service');
        const migrationNeeded = await migrationModule.isMigrationNeeded();

        if (migrationNeeded) {
          logger.info(
            'Migration needed from vrchat-photo-journey (waiting for user confirmation)',
          );
          // ユーザー確認が必要なため、ここでは移行を実行しない
          // フロントエンドで確認ダイアログを表示し、承認後に performMigration エンドポイントを呼ぶ
        } else {
          logger.debug('No migration needed');
        }

        // Step 1: データベース同期
        logger.info('Step 1: Syncing database schema...');
        await sequelizeClient.syncRDBClient();

        // Step 2: ディレクトリチェック
        logger.info('Step 2: Checking VRChat directories...');

        // VRChatログディレクトリの存在確認は、ログ同期時のエラーで判定する
        // 事前チェックは省略し、ログ同期エラーで詳細なエラーを提供

        // Step 3: 初回起動判定とPhotoPath変更確認
        logger.info('Step 3: Checking if this is first launch...');
        let isFirstLaunch = true;
        let syncMode: LogSyncMode = LOG_SYNC_MODE.FULL;

        try {
          const existingLogs =
            await vrchatWorldJoinLogService.findVRChatWorldJoinLogList({
              orderByJoinDateTime: 'desc',
            });
          isFirstLaunch = existingLogs.length === 0;

          // PhotoPath変更の確認
          const photoPathChanged = hasPhotoPathChanged();

          // 同期モード決定: 初回起動 OR PhotoPath変更時は FULL モード
          syncMode =
            isFirstLaunch || photoPathChanged
              ? LOG_SYNC_MODE.FULL
              : LOG_SYNC_MODE.INCREMENTAL;

          logger.info(`Found ${existingLogs.length} existing logs`);
          if (photoPathChanged) {
            logger.info(
              'PhotoPath change detected, forcing FULL sync mode for photo re-indexing',
            );
          }
        } catch (error) {
          // データベースエラー（テーブル未作成など）の場合は初回起動として扱う
          logger.info(
            'Database error detected, treating as first launch:',
            error,
          );
          isFirstLaunch = true;
          syncMode = LOG_SYNC_MODE.FULL;
        }

        logger.info(
          `Detected ${
            isFirstLaunch ? 'first launch' : 'regular launch'
          }, using ${syncMode} sync mode`,
        );

        // Step 3.5: 初回起動時に自動起動を有効化
        if (isFirstLaunch) {
          logger.info(
            'Step 3.5: Setting default auto-start enabled for first launch...',
          );
          try {
            const { app } = await import('electron');
            app.setLoginItemSettings({
              openAtLogin: true,
              openAsHidden: true,
            });
            logger.info('Auto-start enabled by default for first launch');
          } catch (error) {
            logger.warn('Failed to set default auto-start:', error);
            // 自動起動の設定に失敗してもアプリの初期化は続行
          }
        }

        // Step 4: ログ同期実行
        logger.info('Step 4: Starting log sync...');
        const logSyncResult = await syncLogs(syncMode);

        if (logSyncResult.isErr()) {
          // ログ同期エラーの場合、詳細なエラータイプを特定
          const errorCode = logSyncResult.error.code;

          match(errorCode)
            .with('APPEND_LOGS_FAILED', () => {
              // VRChatログファイル関連の設定（初期セットアップが必要）
              throw UserFacingError.withStructuredInfo({
                code: ERROR_CODES.VRCHAT_DIRECTORY_SETUP_REQUIRED,
                category: ERROR_CATEGORIES.SETUP_REQUIRED,
                message:
                  'VRChat directory setup is required for initial configuration',
                userMessage:
                  'VRChatフォルダの設定が必要です。初期セットアップを開始します。',
                details: {
                  syncError: logSyncResult.error,
                },
              });
            })
            .otherwise(() => {
              // その他のエラーは何もしない（後続の処理で警告ログ出力）
            });

          // 開発環境ではwarnレベルでログ記録（Sentryに送信されない）
          logger.warn(
            `Log sync failed: ${
              logSyncResult.error.message || 'Unknown error'
            }. This is normal in development environments without VRChat logs.`,
          );
        } else {
          logger.info('Log sync completed successfully');
        }

        logger.info('=== Application data initialization completed ===');
        return { success: true };
      } catch (error) {
        logger.error({
          message: 'Application data initialization failed',
          stack: match(error)
            .with(P.instanceOf(Error), (err) => err)
            .otherwise(() => undefined),
        });

        // UserFacingErrorの場合は構造化情報を保持して再スロー
        if (error instanceof UserFacingError) {
          throw error;
        }

        // その他のエラーの場合は新しいUserFacingErrorでラップ
        const errorMessage = match(error)
          .with(P.instanceOf(Error), (err) => err.message)
          .otherwise(() => 'Unknown initialization error');
        throw new UserFacingError(`初期化に失敗しました: ${errorMessage}`);
      } finally {
        // 処理完了後にフラグをリセット
        isInitializing = false;
      }
    }),

    /**
     * 旧アプリからの移行が必要かどうかをチェックする
     */
    checkMigrationStatus: procedure.query(async () => {
      logger.debug('[Settings] Checking migration status...');
      const migrationModule = await import('../migration/service');
      const isNeeded = await migrationModule.isMigrationNeeded();
      const result = {
        migrationNeeded: isNeeded,
        oldAppName: 'vrchat-photo-journey',
        newAppName: 'VRChatAlbums',
      };
      logger.debug('[Settings] Migration status check result:', result);
      return result;
    }),

    /**
     * ユーザーの承認を得て旧アプリからのデータ移行を実行する
     */
    performMigration: procedure.mutation(async () => {
      const migrationModule = await import('../migration/service');

      // 再度移行が必要かチェック
      const isNeeded = await migrationModule.isMigrationNeeded();
      if (!isNeeded) {
        throw new UserFacingError('データ移行は不要です');
      }

      logger.info('User approved migration, starting migration process...');
      const migrationResult = await migrationModule.performMigration();

      if (migrationResult.isErr()) {
        logger.error({
          message: `Migration failed: ${migrationResult.error.message}`,
          stack: migrationResult.error,
        });
        throw UserFacingError.withStructuredInfo({
          code: ERROR_CODES.MIGRATION_FAILED,
          category: ERROR_CATEGORIES.DATABASE_ERROR,
          message: 'Data migration failed',
          userMessage: `データ移行に失敗しました: ${migrationResult.error.message}`,
        });
      }

      logger.info('Migration completed successfully:', migrationResult.value);

      // 移行結果を返す
      const { details, errors } = migrationResult.value;
      const migratedItems = [];
      if (details.logStore) migratedItems.push('ログデータ');
      if (details.settings) migratedItems.push('設定');

      return {
        success: true,
        migratedItems,
        errors,
        details,
      };
    }),

    /**
     * 移行通知が表示されたかどうかを取得する
     */
    getMigrationNoticeShown: procedure.query(async () => {
      const settingStore = getSettingStore();
      const shown = settingStore.getMigrationNoticeShown();
      logger.debug('[Settings] getMigrationNoticeShown:', shown);
      return shown;
    }),

    /**
     * 移行通知が表示されたことを記録する
     */
    setMigrationNoticeShown: procedure.mutation(async () => {
      const settingStore = getSettingStore();
      settingStore.setMigrationNoticeShown(true);
      return { success: true };
    }),

    /**
     * デバッグ用：アプリのディレクトリ情報を取得
     */
    getAppDirectories: procedure.query(async () => {
      const { app } = await import('electron');
      const currentUserDataPath = app.getPath('userData');
      const parentDir = require('node:path').dirname(currentUserDataPath);
      const fs = require('node:fs');

      // 親ディレクトリの内容を確認
      let siblingDirs: string[] = [];
      try {
        siblingDirs = fs.readdirSync(parentDir).filter((name: string) => {
          const fullPath = require('node:path').join(parentDir, name);
          return fs.statSync(fullPath).isDirectory();
        });
      } catch (error) {
        logger.error({
          message: 'Failed to read parent directory',
          stack: error instanceof Error ? error : new Error(String(error)),
        });
      }

      return {
        currentUserDataPath,
        parentDir,
        siblingDirs,
        migrationMarkerExists: fs.existsSync(
          require('node:path').join(
            currentUserDataPath,
            '.migration-completed',
          ),
        ),
      };
    }),

    /**
     * デバッグ用：移行通知フラグをリセット
     */
    resetMigrationNotice: procedure.mutation(async () => {
      const settingStore = getSettingStore();
      settingStore.setMigrationNoticeShown(false);
      logger.info('[Settings] Reset migration notice flag');
      return { success: true };
    }),
  });
