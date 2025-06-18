import * as nodeFs from 'node:fs';
import * as nodeFsPromises from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import { err, ok, type Result } from 'neverthrow';
import { match, P } from 'ts-pattern';
import { logger } from '../../lib/logger';
import { importService } from '../vrchatLog/importService/importService';
import * as vrchatWorldJoinLogService from '../vrchatWorldJoinLog/service';

export interface MigrationResult {
  migrated: boolean;
  details: {
    database: boolean;
    logStore: boolean;
    settings: boolean;
  };
  errors: string[];
}

// Cache for migration check results to avoid repeated file system operations
let migrationCheckCache: {
  result: boolean;
  timestamp: number;
} | null = null;

// Cache for old app path to avoid repeated directory scans
let oldAppPathCache: string | null = null;

// Cache lifetime in milliseconds (5 minutes)
const CACHE_LIFETIME = 5 * 60 * 1000;

/**
 * Clear migration caches (useful after migration is performed)
 */
export const clearMigrationCache = (): void => {
  migrationCheckCache = null;
  oldAppPathCache = null;
  logger.debug('[Migration] Cleared migration caches');
};

/**
 * Get the path to the old app's user data directory
 */
const getOldAppUserDataPath = (): string => {
  // Return cached path if available
  if (oldAppPathCache !== null) {
    logger.debug('[Migration] Using cached old app path:', oldAppPathCache);
    return oldAppPathCache;
  }

  // Get the parent directory of the current userData path
  const currentUserDataPath = app.getPath('userData');
  const parentDir = path.dirname(currentUserDataPath);

  logger.debug('[Migration] Searching for old app directory:', {
    currentUserDataPath,
    parentDir,
  });

  // The old app name was 'vrchat-photo-journey'
  // Note: On Windows, Electron might create 'VRChatPhotoJourney' instead
  const possibleNames = ['vrchat-photo-journey', 'VRChatPhotoJourney'];

  for (const name of possibleNames) {
    const oldPath = path.join(parentDir, name);
    logger.debug(`[Migration] Checking path: ${oldPath}`);
    if (nodeFs.existsSync(oldPath)) {
      logger.info(`Found old app directory: ${oldPath}`);
      oldAppPathCache = oldPath;
      return oldPath;
    }
  }

  logger.debug(
    `No old app directory found. Checked: ${possibleNames.join(
      ', ',
    )} in ${parentDir}`,
  );
  const defaultPath = path.join(parentDir, 'vrchat-photo-journey');
  oldAppPathCache = defaultPath;
  return defaultPath;
};

/**
 * Check if migration is needed
 */
export const isMigrationNeeded = async (): Promise<boolean> => {
  // Check cache first
  if (migrationCheckCache !== null) {
    const cacheAge = Date.now() - migrationCheckCache.timestamp;
    if (cacheAge < CACHE_LIFETIME) {
      logger.debug(
        '[Migration] Using cached migration check result:',
        migrationCheckCache.result,
      );
      return migrationCheckCache.result;
    }
  }

  const oldAppPath = getOldAppUserDataPath();
  const currentAppPath = app.getPath('userData');

  logger.debug('[Migration] Checking migration status:', {
    oldAppPath,
    currentAppPath,
  });

  // Check if old app directory exists
  if (!nodeFs.existsSync(oldAppPath)) {
    logger.debug('No old app data found, migration not needed');
    migrationCheckCache = { result: false, timestamp: Date.now() };
    return false;
  }

  // Check if migration marker exists (to prevent re-migration)
  const migrationMarkerPath = path.join(currentAppPath, '.migration-completed');
  if (nodeFs.existsSync(migrationMarkerPath)) {
    logger.debug('Migration already completed, skipping');
    migrationCheckCache = { result: false, timestamp: Date.now() };
    return false;
  }

  logger.info('Migration needed from old app directory');
  migrationCheckCache = { result: true, timestamp: Date.now() };
  return true;
};

/**
 * Copy a file from source to destination
 */
const copyFile = async (
  src: string,
  dest: string,
): Promise<Result<void, Error>> => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(dest);
    await nodeFsPromises.mkdir(destDir, { recursive: true });

    // Copy the file
    await nodeFsPromises.copyFile(src, dest);
    return ok(undefined);
  } catch (error) {
    return err(
      match(error)
        .with(
          { code: 'ENOENT' },
          () => new Error(`Source file not found: ${src}`),
        )
        .with({ code: 'EACCES' }, () => new Error(`Permission denied: ${dest}`))
        .otherwise(() => new Error(`Failed to copy file: ${error}`)),
    );
  }
};

/**
 * Copy a directory recursively
 */
const _copyDirectory = async (
  src: string,
  dest: string,
): Promise<Result<void, Error>> => {
  try {
    // Create destination directory
    await nodeFsPromises.mkdir(dest, { recursive: true });

    // Read source directory
    const entries = await nodeFsPromises.readdir(src, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        const result = await _copyDirectory(srcPath, destPath);
        if (result.isErr()) {
          return result;
        }
      } else {
        const result = await copyFile(srcPath, destPath);
        if (result.isErr()) {
          return result;
        }
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(new Error(`Failed to copy directory: ${error}`));
  }
};

/**
 * Migrate log store directory using importService
 */
const migrateLogStore = async (
  oldAppPath: string,
): Promise<Result<boolean, Error>> => {
  const oldLogStorePath = path.join(oldAppPath, 'logStore');

  if (!nodeFs.existsSync(oldLogStorePath)) {
    logger.info('No logStore directory found in old app directory');
    return ok(false);
  }

  logger.info(`Importing logStore from ${oldLogStorePath}`);

  // DBログプロバイダー関数を定義
  const getDBLogs = async () => {
    const logs = await vrchatWorldJoinLogService.findVRChatWorldJoinLogList({
      orderByJoinDateTime: 'desc',
    });

    // LogRecord型に変換
    return logs.map((log) => ({
      type: 'worldJoin' as const,
      record: {
        id: log.id,
        worldId: log.worldId,
        worldName: log.worldName,
        worldInstanceId: log.worldInstanceId,
        joinDateTime: log.joinDateTime,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt || new Date(), // null の場合は現在時刻をセット
      },
    }));
  };

  // importServiceを使用してログをインポート
  const result = await importService.importLogStoreFiles(
    [oldLogStorePath],
    getDBLogs,
  );

  if (result.isErr()) {
    return err(result.error);
  }

  logger.info(
    `Successfully imported ${result.value.importedData.totalLines} log lines from ${result.value.importedData.processedFiles.length} files`,
  );

  return ok(true);
};

/**
 * Migrate settings (electron-store data)
 */
const migrateSettings = async (
  oldAppPath: string,
  currentAppPath: string,
): Promise<Result<boolean, Error>> => {
  // Electron-store typically saves config.json in the userData directory
  const oldSettingsPath = path.join(oldAppPath, 'config.json');
  const newSettingsPath = path.join(currentAppPath, 'config.json');

  if (!nodeFs.existsSync(oldSettingsPath)) {
    logger.info('No settings file found in old app directory');
    return ok(false);
  }

  logger.info(
    `Migrating settings from ${oldSettingsPath} to ${newSettingsPath}`,
  );
  const result = await copyFile(oldSettingsPath, newSettingsPath);

  return result.isOk() ? ok(true) : err(result.error);
};

/**
 * Create migration marker file
 */
const createMigrationMarker = async (
  currentAppPath: string,
  migrationResult: MigrationResult,
): Promise<Result<void, Error>> => {
  const markerPath = path.join(currentAppPath, '.migration-completed');
  const markerContent = JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      fromApp: 'vrchat-photo-journey',
      toApp: 'VRChatAlbums',
      result: migrationResult,
    },
    null,
    2,
  );

  try {
    await nodeFsPromises.writeFile(markerPath, markerContent, 'utf-8');
    return ok(undefined);
  } catch (error) {
    return err(new Error(`Failed to create migration marker: ${error}`));
  }
};

/**
 * Perform the migration from old app to new app
 */
export const performMigration = async (): Promise<
  Result<MigrationResult, Error>
> => {
  const oldAppPath = getOldAppUserDataPath();
  const currentAppPath = app.getPath('userData');

  logger.info('Starting migration process...');
  logger.info(`Old app path: ${oldAppPath}`);
  logger.info(`Current app path: ${currentAppPath}`);

  const result: MigrationResult = {
    migrated: false,
    details: {
      database: false, // No longer copying database
      logStore: false,
      settings: false,
    },
    errors: [],
  };

  // Ensure current app directory exists
  try {
    await nodeFsPromises.mkdir(currentAppPath, { recursive: true });
  } catch (error) {
    return err(new Error(`Failed to create app directory: ${error}`));
  }

  // Migrate log store (this will import logs into the existing database)
  const logStoreResult = await migrateLogStore(oldAppPath);
  if (logStoreResult.isOk()) {
    result.details.logStore = logStoreResult.value;
  } else {
    result.errors.push(
      `LogStore import failed: ${logStoreResult.error.message}`,
    );
  }

  // Migrate settings
  const settingsResult = await migrateSettings(oldAppPath, currentAppPath);
  if (settingsResult.isOk()) {
    result.details.settings = settingsResult.value;
  } else {
    result.errors.push(
      `Settings migration failed: ${settingsResult.error.message}`,
    );
  }

  // Determine if migration was successful
  result.migrated = result.details.logStore || result.details.settings;

  // Create migration marker
  if (result.migrated) {
    const markerResult = await createMigrationMarker(currentAppPath, result);
    if (markerResult.isErr()) {
      result.errors.push(
        `Failed to create migration marker: ${markerResult.error.message}`,
      );
    }
  }

  // Clear migration cache after every migration attempt (success or failure)
  clearMigrationCache();

  logger.info('Migration completed:', result);
  return ok(result);
};

/**
 * Perform migration if needed (convenience function for startup)
 */
export const performMigrationIfNeeded = async (): Promise<void> => {
  try {
    const migrationNeeded = await isMigrationNeeded();
    if (!migrationNeeded) {
      return;
    }

    logger.info('Migration needed, starting migration process...');
    const result = await performMigration();

    if (result.isErr()) {
      logger.error({
        message: 'Migration failed',
        stack: result.error,
      });
      // Don't throw - allow app to continue even if migration fails
      return;
    }

    if (result.value.errors.length > 0) {
      logger.warn('Migration completed with errors:', result.value.errors);
    } else {
      logger.info('Migration completed successfully');
    }
  } catch (error) {
    logger.error({
      message: 'Unexpected error during migration check',
      stack: match(error)
        .with({ message: P.string }, (err) => err as Error)
        .otherwise(() => new Error(String(error))),
    });
    // Don't throw - allow app to continue
  }
};
