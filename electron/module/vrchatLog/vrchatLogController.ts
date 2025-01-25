import * as neverthrow from 'neverthrow';
import { match } from 'ts-pattern';
import * as log from './../../lib/logger';
import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatLogFileDirService from './../vrchatLogFileDir/service';
import * as vrchatLogService from './service';

/**
 * もともとのVRC Log File 解析に必要な行だけ抜き出して、保管用のファイルに保存する
 */
const appendLoglinesToFileFromLogFilePathList = async (): Promise<
  neverthrow.Result<void, Error>
> => {
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

  const result = await vrchatLogService.appendLoglinesToFile({
    logLines: logLineList.value,
    logStoreFilePath: vrchatLogService.getLogStoreFilePath(),
  });
  if (result.isErr()) {
    return neverthrow.err(result.error);
  }

  return neverthrow.ok(undefined);
};

export const vrchatLogRouter = () =>
  trpcRouter({
    appendLoglinesToFileFromLogFilePathList: procedure.mutation(async () => {
      log.info('appendLoglinesToFileFromLogFilePathList');
      const result = await appendLoglinesToFileFromLogFilePathList();
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    }),
  });
