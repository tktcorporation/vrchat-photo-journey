import * as nodeFsPromises from 'node:fs/promises';
import * as path from 'node:path';
import { type Result, ok } from 'neverthrow';
import { logger } from '../../lib/logger';

export interface MigrationResult {
  migrated: boolean;
  details: {
    database: boolean;
    logStore: boolean;
    settings: boolean;
  };
  errors: string[];
}

// キャッシュで高速化
interface MigrationCheckCache {
  result: boolean;
  timestamp: number;
}
let migrationCheckCache: MigrationCheckCache | null = null;
const CACHE_LIFETIME = 5 * 60 * 1000; // 5分

/**
 * Check if migration is needed
 * エラーが発生した場合はfalseを返して正常に動作を継続
 */
export const isMigrationNeeded = async (): Promise<boolean> => {
  // キャッシュチェック
  if (migrationCheckCache !== null) {
    const cacheAge = Date.now() - migrationCheckCache.timestamp;
    if (cacheAge < CACHE_LIFETIME) {
      return migrationCheckCache.result;
    }
  }

  try {
    const { app } = await import('electron');
    const oldAppPath = await getOldAppUserDataPath();
    const currentAppPath = app.getPath('userData');

    logger.debug('[Migration] Checking migration status:', {
      oldAppPath,
      currentAppPath,
    });

    // Check if old app directory exists
    const oldAppExists = await nodeFsPromises
      .access(oldAppPath)
      .then(() => true)
      .catch(() => false);

    if (!oldAppExists) {
      logger.debug('No old app data found, migration not needed');
      const result = false;
      // キャッシュに保存
      migrationCheckCache = {
        result,
        timestamp: Date.now(),
      };
      return result;
    }

    // Check if migration marker exists (to prevent re-migration)
    const migrationMarkerPath = path.join(
      currentAppPath,
      '.migration-completed',
    );
    const markerExists = await nodeFsPromises
      .access(migrationMarkerPath)
      .then(() => true)
      .catch(() => false);

    if (markerExists) {
      logger.debug('Migration already completed, skipping');
      const result = false;
      // キャッシュに保存
      migrationCheckCache = {
        result,
        timestamp: Date.now(),
      };
      return result;
    }

    logger.info('Migration needed from old app directory');
    const result = true;
    // キャッシュに保存
    migrationCheckCache = {
      result,
      timestamp: Date.now(),
    };
    return result;
  } catch (error) {
    logger.error({
      message: 'Error checking migration status',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
    const result = false;
    // エラー時もキャッシュに保存（頻繁なファイルアクセスを防ぐ）
    migrationCheckCache = {
      result,
      timestamp: Date.now(),
    };
    return result;
  }
};

/**
 * Get the path to the old app's user data directory
 * 同期的なファイルアクセスを避けて、パスのみ返す
 */
const getOldAppUserDataPath = async (): Promise<string> => {
  try {
    const { app } = await import('electron');
    const currentUserDataPath = app.getPath('userData');
    const parentDir = path.dirname(currentUserDataPath);
    // デフォルトのパスを返す（存在チェックは非同期で行う）
    return path.join(parentDir, 'vrchat-photo-journey');
  } catch (error) {
    logger.error({
      message: 'Failed to get old app path',
      stack: error instanceof Error ? error : new Error(String(error)),
    });
    return '';
  }
};

/**
 * Perform the migration from old app to new app
 */
export const performMigration = async (): Promise<
  Result<MigrationResult, Error>
> => {
  const { app } = await import('electron');
  const oldAppPath = await getOldAppUserDataPath();
  const currentAppPath = app.getPath('userData');

  logger.info('Starting migration process...');
  logger.info(`Old app path: ${oldAppPath}`);
  logger.info(`Current app path: ${currentAppPath}`);

  const result: MigrationResult = {
    migrated: false,
    details: {
      database: false,
      logStore: false,
      settings: false,
    },
    errors: [],
  };

  // TODO: Implement actual migration logic here
  // For now, just create the marker file
  try {
    const markerPath = path.join(currentAppPath, '.migration-completed');
    const markerContent = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        fromApp: 'vrchat-photo-journey',
        toApp: 'VRChatAlbums',
        result: result,
      },
      null,
      2,
    );

    await nodeFsPromises.writeFile(markerPath, markerContent, 'utf-8');
    result.migrated = true;
  } catch (error) {
    result.errors.push(`Failed to create migration marker: ${error}`);
  }

  logger.info('Migration completed:', result);
  return ok(result);
};
