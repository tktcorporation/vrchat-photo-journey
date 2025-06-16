import * as nodeFs from 'node:fs';
import readline from 'node:readline';
import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
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
 * 複数のログファイルから指定された文字列を含む行を抽出
 * @param props.logFilePathList ログファイルパスのリスト
 * @param props.includesList 抽出対象とする文字列のリスト
 * @returns 抽出されたVRChatLogLineの配列
 */
export const getLogLinesByLogFilePathList = async (props: {
  logFilePathList: (VRChatLogFilePath | VRChatLogStoreFilePath)[];
  includesList: string[];
}): Promise<neverthrow.Result<VRChatLogLine[], VRChatLogFileError>> => {
  const logLineList: VRChatLogLine[] = [];
  const errors: VRChatLogFileError[] = [];

  await Promise.all(
    props.logFilePathList.map(async (logFilePath) => {
      const result = await getLogLinesFromLogFile({
        logFilePath,
        includesList: props.includesList,
      });
      if (result.isErr()) {
        errors.push(result.error);
        return;
      }
      logLineList.push(
        ...result.value.map((line) => VRChatLogLineSchema.parse(line)),
      );
    }),
  );

  return match(errors.length > 0)
    .with(true, () =>
      neverthrow.err<VRChatLogLine[], VRChatLogFileError>(errors[0]),
    )
    .with(false, () => neverthrow.ok(logLineList))
    .exhaustive();
};
