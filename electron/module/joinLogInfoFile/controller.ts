import * as neverthrow from 'neverthrow';
import { getService } from '../service';
import * as vrchatLogService from '../service/vrchatLog/vrchatLog';
import * as vrchatPhotoService from '../service/vrchatPhoto/service';
import {
  eventEmitter,
  logError,
  procedure,
  router as trpcRouter,
} from './../../trpc';
import type { getSettingStore } from './../settingStore';
import * as joinLogInfoFileService from './service';

const getConfigAndValidateAndCreateFiles =
  (settingStore: ReturnType<typeof getSettingStore>) =>
  async (): Promise<neverthrow.Result<void, string>> => {
    const service = getService(settingStore);

    // vrchat log のディレクトリを取得
    const logFilesDir = service.getVRChatLogFilesDir();
    if (logFilesDir.error !== null) {
      return neverthrow.err(`${logFilesDir.error}`);
    }

    // vrchat log のディレクトリから join 情報を取得
    const vrchatLogLinesResult = await vrchatLogService.getLogLinesFromDir({
      storedLogFilesDirPath: settingStore.getLogFilesDir(),
      logFilesDir: logFilesDir.path,
    });
    if (vrchatLogLinesResult.isErr()) {
      return neverthrow.err(`${vrchatLogLinesResult.error.code}`);
    }
    // join log の行を join log info の形式に変換
    const worldJoinLogInfoList =
      vrchatLogService.convertLogLinesToWorldJoinLogInfos(
        vrchatLogLinesResult.value,
      );

    // ファイルを作成する場所になる vrchat photo のディレクトリを取得
    const vrchatPhotoDir = vrchatPhotoService.getVRChatPhotoDir({
      storedPath: settingStore.getVRChatPhotoDir(),
    });
    if (vrchatPhotoDir.error !== null) {
      return neverthrow.err(vrchatPhotoDir.error);
    }
    // join情報を記録するファイルを作成
    const result = await joinLogInfoFileService.createFiles({
      vrchatPhotoDir: vrchatPhotoDir.path,
      worldJoinLogInfoList: worldJoinLogInfoList,
      removeAdjacentDuplicateWorldEntriesFlag:
        settingStore.getRemoveAdjacentDuplicateWorldEntriesFlag() ?? false,
    });
    return result
      .map(() => {
        return undefined;
      })
      .mapErr((error) => {
        return `${error.type}: ${error.error}`;
      });
  };

export const joinInfoLogFileRouter = (
  settingStore: ReturnType<typeof getSettingStore>,
) =>
  trpcRouter({
    createFiles: procedure.mutation(async () => {
      const result = await getConfigAndValidateAndCreateFiles(settingStore)();
      return result.match(
        () => {
          eventEmitter.emit('toast', 'ファイルの作成に成功しました');
          return true;
        },
        (error) => {
          logError(error);
          return false;
        },
      );
    }),
  });
