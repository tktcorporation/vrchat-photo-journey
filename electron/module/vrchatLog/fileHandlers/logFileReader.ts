import * as nodeFs from 'node:fs';
import readline from 'node:readline';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import { logger } from '../../../lib/logger';
import * as fs from '../../../lib/wrappedFs';
import type { VRChatLogFilePath } from '../../vrchatLogFileDir/model';
import type { VRChatLogFileError } from '../error';
import type { VRChatLogLine, VRChatLogStoreFilePath } from '../model';
import { VRChatLogLineSchema } from '../model';

/**
 * VRChatログファイルの読み込み機能
 */

/**
 * ログファイルから指定された文字列を含む行を抽出
 * @param props.logFilePath ログファイルのパス
 * @param props.includesList 抽出対象とする文字列のリスト
 * @returns 抽出されたログ行の配列
 */
export const getLogLinesFromLogFile = async (props: {
  logFilePath: VRChatLogFilePath | VRChatLogStoreFilePath;
  includesList: string[];
}): Promise<neverthrow.Result<string[], VRChatLogFileError>> => {
  // ファイルが存在するか確認
  return match(nodeFs.existsSync(props.logFilePath.value))
    .with(false, () => neverthrow.ok<string[], VRChatLogFileError>([]))
    .with(true, async () => {
      const stream = fs.createReadStream(props.logFilePath.value);
      const reader = readline.createInterface({
        input: stream,
        crlfDelay: Number.POSITIVE_INFINITY,
      });

      const lines: string[] = [];
      reader.on('line', (line) => {
        // includesList の配列の中のどれかと一致したら追加
        if (props.includesList.some((include) => line.includes(include))) {
          lines.push(line);
        }
      });

      await Promise.all([
        new Promise((resolve) => {
          stream.on('close', () => {
            resolve(null);
          });
        }),
      ]);

      return neverthrow.ok(lines);
    })
    .exhaustive();
};

/**
 * 単一のログファイルから指定された文字列を含む行を読み込み、パースする内部ヘルパー関数。
 * @param props.logFilePath ログファイルのパス
 * @param props.includesList 抽出対象とする文字列のリスト
 * @returns パースされたVRChatLogLineの配列、またはエラー
 */
const _getAndParseLogLinesFromFile = async (props: {
  logFilePath: VRChatLogFilePath | VRChatLogStoreFilePath;
  includesList: string[];
}): Promise<neverthrow.Result<VRChatLogLine[], VRChatLogFileError>> => {
  const result = await getLogLinesFromLogFile({
    logFilePath: props.logFilePath,
    includesList: props.includesList,
  });
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }
  try {
    const parsedLines = result.value.map((line) => VRChatLogLineSchema.parse(line));
    return neverthrow.ok(parsedLines);
  } catch (e) {
    // zodパースエラーなどをキャッチする想定
    logger.error(`Error parsing log lines from ${props.logFilePath.value}: ${e}`);
    // VRChatLogFileError 型に合うように具体的なエラーオブジェクトを返すか、型定義を見直す必要がある
    // ここでは仮のエラーを返す
    return neverthrow.err({
      kind: 'ReadFileError', // 仮のエラー種別
      filePath: props.logFilePath.value,
      message: e instanceof Error ? e.message : String(e),
      error: e instanceof Error ? e : new Error(String(e)),
    } as VRChatLogFileError); // VRChatLogFileError に合わせてキャスト
  }
};

/**
 * 複数のログファイルから指定された文字列を含む行を抽出
 * @param props.logFilePathList ログファイルパスのリスト
 * @param props.includesList 抽出対象とする文字列のリスト
 * @param props.concurrency 並列処理数（デフォルト: 5）
 * @returns 抽出されたVRChatLogLineの配列
 */
export const getLogLinesByLogFilePathList = async (props: {
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[];
  includesList: string[];
  concurrency?: number;
  maxMemoryUsageMB?: number; // メモリ使用量の上限（MB）
}): Promise<neverthrow.Result<VRChatLogLine[], VRChatLogFileError>> => {
  const logLineList: VRChatLogLine[] = [];
  const errors: VRChatLogFileError[] = [];
  const concurrency = props.concurrency ?? 5; // デフォルトの並列数を制限
  const maxMemoryUsageMB = props.maxMemoryUsageMB ?? 500; // デフォルト500MB
  const maxLinesInMemory = Math.floor((maxMemoryUsageMB * 1024 * 1024) / 200); // 1行約200バイトと仮定

  // メモリ使用量のチェック
  const checkMemoryUsage = () => {
    const memUsage = process.memoryUsage();
    const usedMB = memUsage.heapUsed / 1024 / 1024;
    return usedMB;
  };

  // バッチ処理で並列数を制限
  for (let i = 0; i < props.logFilePathList.length; i += concurrency) {
    const batch = props.logFilePathList.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (logFilePath) => {
        const result = await _getAndParseLogLinesFromFile({ // Refactored
          logFilePath,
          includesList: props.includesList,
        });
        if (result.isErr()) {
          errors.push(result.error);
          return []; // エラー時は空配列を返す
        }
        return result.value; // 既にパースされた VRChatLogLine[]
      }),
    );

    // バッチの結果を統合
    for (const lines of batchResults) { // lines は VRChatLogLine[]
      logLineList.push(...lines);

      // メモリ使用量をチェックし、上限に近づいたら警告
      if (logLineList.length > maxLinesInMemory) {
        const usedMB = checkMemoryUsage();
        logger.warn(
          `Log lines in memory: ${logLineList.length} (Memory: ${usedMB.toFixed(
            2,
          )}MB). Consider processing in smaller batches.`,
        );
      }
    }
  }

  logger.info(
    `Loaded ${logLineList.length} log lines from ${
      props.logFilePathList.length
    } files (Memory: ${checkMemoryUsage().toFixed(2)}MB)`,
  );

  return match(errors.length > 0)
    .with(true, () =>
      neverthrow.err<VRChatLogLine[], VRChatLogFileError>(errors[0]),
    )
    .with(false, () => neverthrow.ok(logLineList))
    .exhaustive();
};

/**
 * 複数のログファイルから指定された文字列を含む行をストリーミングで抽出
 * メモリ効率を考慮し、ジェネレータでバッチごとに結果を返す
 * @param props.logFilePathList ログファイルパスのリスト
 * @param props.includesList 抽出対象とする文字列のリスト
 * @param props.concurrency 並列処理数（デフォルト: 5）
 * @param props.batchSize バッチサイズ（デフォルト: 1000行）
 * @param props.maxMemoryUsageMB メモリ使用量の上限（MB、デフォルト: 500）
 */
export async function* getLogLinesByLogFilePathListStreaming(props: {
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[];
  includesList: string[];
  concurrency?: number;
  batchSize?: number;
  maxMemoryUsageMB?: number;
}): AsyncGenerator<VRChatLogLine[], void, unknown> {
  const concurrency = props.concurrency ?? 5;
  const batchSize = props.batchSize ?? 1000;
  const maxMemoryUsageMB = props.maxMemoryUsageMB ?? 500;
  let accumulatedLines: VRChatLogLine[] = [];
  let totalLinesProcessed = 0;

  // メモリ使用量のチェック関数
  const checkMemoryUsage = () => {
    const memUsage = process.memoryUsage();
    const usedMB = memUsage.heapUsed / 1024 / 1024;
    return usedMB;
  };

  // メモリ使用量の上限チェック
  const checkMemoryLimit = () => {
    const currentUsage = checkMemoryUsage();
    if (currentUsage > maxMemoryUsageMB) {
      throw new Error(
        `Memory usage exceeded limit: ${currentUsage.toFixed(
          2,
        )}MB > ${maxMemoryUsageMB}MB. Processing stopped to prevent system instability.`,
      );
    }
    return currentUsage;
  };

  // ファイルバッチごとに処理
  for (let i = 0; i < props.logFilePathList.length; i += concurrency) {
    // メモリ使用量をチェック
    const currentMemory = checkMemoryLimit();
    logger.debug(
      `Processing file batch ${
        Math.floor(i / concurrency) + 1
      }, memory: ${currentMemory.toFixed(2)}MB`,
    );

    const fileBatch = props.logFilePathList.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      fileBatch.map(async (logFilePath) => {
        const result = await _getAndParseLogLinesFromFile({ // Refactored
          logFilePath,
          includesList: props.includesList,
        });
        if (result.isErr()) {
          // ストリーミング版ではエラー発生時に即座にスローする
          throw result.error;
        }
        return result.value; // 既にパースされた VRChatLogLine[]
      }),
    );

    // 各ファイルの結果を処理
    for (const lines of batchResults) { // lines は VRChatLogLine[]
      accumulatedLines.push(...lines);

      // バッチサイズに達したかメモリ使用量をチェック
      while (accumulatedLines.length >= batchSize) {
        const batch = accumulatedLines.slice(0, batchSize);
        accumulatedLines = accumulatedLines.slice(batchSize);
        totalLinesProcessed += batch.length;

        const memoryUsage = checkMemoryUsage();
        logger.debug(
          `Streaming log lines: yielding batch of ${
            batch.length
          } lines (total: ${totalLinesProcessed}, memory: ${memoryUsage.toFixed(
            2,
          )}MB)`,
        );

        // バッチを返す前にメモリチェック
        checkMemoryLimit();
        yield batch;
      }
    }
  }

  // 残りのログ行をyield
  if (accumulatedLines.length > 0) {
    totalLinesProcessed += accumulatedLines.length;
    const memoryUsage = checkMemoryUsage();
    logger.debug(
      `Streaming log lines: yielding final batch of ${
        accumulatedLines.length
      } lines (total: ${totalLinesProcessed}, memory: ${memoryUsage.toFixed(
        2,
      )}MB)`,
    );

    // 最終バッチを返す前にメモリチェック
    checkMemoryLimit();
    yield accumulatedLines;
  }
}
