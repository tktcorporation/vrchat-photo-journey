import * as neverthrow from 'neverthrow';
import { P, match } from 'ts-pattern';
import z from 'zod';
import { logger } from './../../lib/logger';
import { eventEmitter, procedure, router as trpcRouter } from './../../trpc';
import * as playerJoinLogService from './../VRChatPlayerJoinLogModel/playerJoinLog.service';
import * as playerLeaveLogService from './../VRChatPlayerLeaveLogModel/playerLeaveLog.service';
import * as vrchatLogFileDirService from './../vrchatLogFileDir/service';
import * as worldJoinLogService from './../vrchatWorldJoinLog/service';
import type { LogRecord } from './converters/dbToLogStore';
import { exportLogStoreFromDB } from './exportService/exportService';
import * as vrchatLogService from './service';

/**
 * もともとのVRC Log File 解析に必要な行だけ抜き出して、保管用のファイルに保存する
 * processAll=falseの場合、DBに保存されている最新のログ日時以降のみを処理するように改善
 * processAll=trueの場合、すべてのログファイルを処理する
 *
 * logStoreディレクトリは、VRChatログから抽出した必要な情報のみを保存するディレクトリです。
 * これは月ごとに整理され、`logStore/YYYY-MM/logStore-YYYY-MM.txt`という形式で保存されます。
 * 月ごとのログファイルがサイズ制限（10MB）を超えると、タイムスタンプ付きの新しいファイルが作成されます。
 * このディレクトリはメタデータの保存用ではなく、ログデータ自体の保存用です。
 */
export const appendLoglinesToFileFromLogFilePathList = async (
  processAll = false,
): Promise<neverthrow.Result<void, Error>> => {
  const vrchatlogFilesDir =
    await vrchatLogFileDirService.getValidVRChatLogFileDir();
  if (vrchatlogFilesDir.isErr()) {
    return neverthrow.err(
      new Error(
        match(vrchatlogFilesDir.error)
          .with({ error: 'logFilesNotFound' }, () => 'logFilesNotFound')
          .with({ error: 'logFileDirNotFound' }, () => 'logFileDirNotFound')
          .exhaustive(),
      ),
    );
  }

  // DBから最新のログ日時を取得（processAllがfalseの場合のみ）
  let startDate = new Date(0); // デフォルトは最古の日時
  if (!processAll) {
    const latestWorldJoinLog =
      await worldJoinLogService.findLatestWorldJoinLog();
    if (latestWorldJoinLog) {
      startDate = latestWorldJoinLog.joinDateTime;
      logger.info(`Processing logs after ${startDate.toISOString()}`);
    } else {
      logger.info('No existing logs found in DB, processing all logs');
    }
  } else {
    logger.info('Processing all logs (processAll=true)');
  }

  // すべてのログファイルパスを取得
  const logFilePathList =
    await vrchatLogFileDirService.getVRChatLogFilePathList(
      vrchatlogFilesDir.value.path,
    );
  if (logFilePathList.isErr()) {
    return neverthrow.err(
      new Error(
        match(logFilePathList.error)
          .with(
            'ENOENT',
            () => 'logFileDir is found but log files are not found',
          )
          .exhaustive(),
      ),
    );
  }

  logger.info(`Found ${logFilePathList.value.length} log files to process`);

  const logLineList = await vrchatLogService.getLogLinesByLogFilePathList({
    logFilePathList: logFilePathList.value,
    includesList: [
      'VRC Analytics Initialized',
      '[Behaviour] Joining ',
      '[Behaviour] OnPlayerJoined ',
      '[Behaviour] OnPlayerLeft ',
      'VRCApplication: HandleApplicationQuit',
    ],
  });
  if (logLineList.isErr()) {
    return neverthrow.err(logLineList.error);
  }

  // ログ行をフィルタリング（processAll=trueの場合はスキップ）
  const filteredLogLines = processAll
    ? logLineList.value
    : vrchatLogService.filterLogLinesByDate(logLineList.value, startDate);

  if (filteredLogLines.length === 0) {
    logger.info('No new log lines to process after filtering');
    return neverthrow.ok(undefined);
  }

  logger.info(`Processing ${filteredLogLines.length} log lines`);

  // 日付ごとに適切なファイルに保存するため、logStoreFilePathは指定しない
  const result = await vrchatLogService.appendLoglinesToFile({
    logLines: filteredLogLines,
  });
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }

  return neverthrow.ok(undefined);
};

/**
 * DBからlogStore形式でエクスポートする
 * 期間指定がない場合は全データを取得
 */
const getDBLogsFromDatabase = async (
  startDate?: Date,
  endDate?: Date,
): Promise<LogRecord[]> => {
  const logRecords: LogRecord[] = [];

  // ワールド参加ログを取得
  const worldJoinQueryOptions: Parameters<
    typeof worldJoinLogService.findVRChatWorldJoinLogList
  >[0] = {
    orderByJoinDateTime: 'asc',
  };

  // 期間指定がある場合のみフィルタを追加
  if (startDate) {
    worldJoinQueryOptions.gtJoinDateTime = startDate;
  }
  if (endDate) {
    worldJoinQueryOptions.ltJoinDateTime = endDate;
  }

  const worldJoinResult = await worldJoinLogService.findVRChatWorldJoinLogList(
    worldJoinQueryOptions,
  );

  for (const log of worldJoinResult) {
    logRecords.push({
      type: 'worldJoin',
      record: {
        id: log.id,
        worldId: log.worldId,
        worldName: log.worldName,
        worldInstanceId: log.worldInstanceId,
        joinDateTime: log.joinDateTime,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt || new Date(),
      },
    });
  }

  // プレイヤー参加ログを取得
  let playerJoinResult: Awaited<
    ReturnType<
      typeof playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime
    >
  >;

  if (startDate) {
    playerJoinResult =
      await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
        startJoinDateTime: startDate,
        endJoinDateTime: endDate || null,
      });
  } else {
    // 期間指定がない場合は、最古の日付から現在までを取得
    const oldestDate = new Date('2017-01-01'); // VRChatリリース日程度
    playerJoinResult =
      await playerJoinLogService.getVRChatPlayerJoinLogListByJoinDateTime({
        startJoinDateTime: oldestDate,
        endJoinDateTime: endDate || new Date(),
      });
  }

  if (playerJoinResult.isOk()) {
    for (const log of playerJoinResult.value) {
      logRecords.push({
        type: 'playerJoin',
        record: {
          id: log.id,
          playerName: log.playerName,
          playerId: log.playerId,
          joinDateTime: log.joinDateTime,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt || new Date(),
        },
      });
    }
  }

  // プレイヤー退出ログを取得
  const playerLeaveQueryOptions: Parameters<
    typeof playerLeaveLogService.findVRChatPlayerLeaveLogList
  >[0] = {
    orderByLeaveDateTime: 'asc',
  };

  // 期間指定がある場合のみフィルタを追加
  if (startDate) {
    playerLeaveQueryOptions.gtLeaveDateTime = startDate;
  }
  if (endDate) {
    playerLeaveQueryOptions.ltLeaveDateTime = endDate;
  }

  const playerLeaveResult =
    await playerLeaveLogService.findVRChatPlayerLeaveLogList(
      playerLeaveQueryOptions,
    );

  for (const log of playerLeaveResult) {
    logRecords.push({
      type: 'playerLeave',
      record: {
        id: log.id,
        playerName: log.playerName,
        playerId: log.playerId,
        leaveDateTime: log.leaveDateTime,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt || new Date(),
      },
    });
  }

  return logRecords;
};

export const vrchatLogRouter = () =>
  trpcRouter({
    appendLoglinesToFileFromLogFilePathList: procedure
      .input(
        z
          .object({
            processAll: z.boolean().optional().default(false),
          })
          .optional()
          .default({}),
      )
      .mutation(async (opts) => {
        const { input } = opts;
        logger.info(
          `appendLoglinesToFileFromLogFilePathList (processAll=${input.processAll})`,
        );
        const result = await appendLoglinesToFileFromLogFilePathList(
          input.processAll,
        );
        if (result.isErr()) {
          throw result.error;
        }
        return result.value;
      }),
    exportLogStoreData: procedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          outputPath: z.string().optional(),
        }),
      )
      .mutation(async (opts) => {
        const { input } = opts;
        const dateRangeMsg =
          input.startDate && input.endDate
            ? `${input.startDate.toISOString()} to ${input.endDate.toISOString()} (received as local time, converted to UTC for DB query)`
            : '全期間';
        logger.info(`exportLogStoreData: ${dateRangeMsg}`);

        try {
          const result = await exportLogStoreFromDB(
            {
              startDate: input.startDate,
              endDate: input.endDate,
              outputBasePath: input.outputPath,
            },
            getDBLogsFromDatabase,
          );

          logger.info(
            `Export completed: ${result.exportedFiles.length} files, ${result.totalLogLines} lines`,
          );

          eventEmitter.emit(
            'toast',
            `エクスポート完了: ${result.exportedFiles.length}ファイル、${result.totalLogLines}行`,
          );

          return result;
        } catch (error) {
          logger.error({
            message: `Export failed: ${String(error)}`,
          });
          const errorMessage = match(error)
            .with(P.instanceOf(Error), (err) => err.message)
            .otherwise((err) => String(err));
          eventEmitter.emit(
            'toast',
            `エクスポートに失敗しました: ${errorMessage}`,
          );
          throw error;
        }
      }),
  });
