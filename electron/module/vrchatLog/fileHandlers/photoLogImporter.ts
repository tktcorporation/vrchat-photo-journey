import path from 'node:path';
import * as datefns from 'date-fns';
import { glob } from 'glob';
import type { VRChatPhotoDirPath } from '../../vrchatPhoto/valueObjects';
import { createVRChatWorldJoinLogFromPhoto } from '../../vrchatWorldJoinLogFromPhoto/service';
import type { VRChatWorldJoinLogFromPhoto } from '../../vrchatWorldJoinLogFromPhoto/vrchatWorldJoinLogFromPhoto.model';

type WorldId = `wrld_${string}`;

/**
 * 写真ファイル名からログ情報をインポートする機能
 * 旧アプリで生成された写真ファイル名にはワールドIDと参加日時が含まれている
 */

/**
 * 写真ディレクトリからワールド参加ログを抽出
 * @param vrChatPhotoDirPath VRChat写真ディレクトリのパス
 * @returns ワールド参加ログの配列
 */
const getLogLinesFromLogPhotoDirPath = async ({
  vrChatPhotoDirPath,
}: { vrChatPhotoDirPath: VRChatPhotoDirPath }): Promise<
  VRChatWorldJoinLogFromPhoto[]
> => {
  // Convert to POSIX format for glob pattern matching
  // glob always expects forward slashes regardless of platform
  const normalizedPath = path.posix.join(
    vrChatPhotoDirPath.value,
    '**',
    'VRChat_*_wrld_*',
  );
  // 正規表現にマッチするファイルを再帰的に取得
  const logPhotoFilePathList = await glob(normalizedPath);

  // ファイル名のパターン:
  // VRChat_YYYY-MM-DD_HH-mm-ss.SSS_wrld_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.ext
  const worldJoinLogList = logPhotoFilePathList
    .map((filePath) => {
      const regex =
        /VRChat_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3})_wrld_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[a-z]+/;
      const matches = filePath.match(regex);
      if (!matches) {
        return null;
      }
      return {
        // ファイル名の日時はlocal timeなので、そのままパース
        joinDate: datefns.parse(
          matches[1],
          'yyyy-MM-dd_HH-mm-ss.SSS',
          new Date(),
        ),
        worldId: `wrld_${matches[2]}` as WorldId,
      };
    })
    .filter((log) => log !== null);

  return worldJoinLogList;
};

/**
 * 写真として保存されているワールドへのJoinログをデータベースに保存
 * @param vrChatPhotoDirPath VRChat写真ディレクトリのパス
 */
export const importLogLinesFromLogPhotoDirPath = async ({
  vrChatPhotoDirPath,
}: { vrChatPhotoDirPath: VRChatPhotoDirPath }): Promise<void> => {
  const logLines = await getLogLinesFromLogPhotoDirPath({
    vrChatPhotoDirPath,
  });

  const worldJoinLogs: VRChatWorldJoinLogFromPhoto[] = logLines.map((log) => ({
    joinDate: log.joinDate,
    worldId: log.worldId,
  }));

  await createVRChatWorldJoinLogFromPhoto(worldJoinLogs);
};
