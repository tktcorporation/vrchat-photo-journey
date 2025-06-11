import * as datefns from 'date-fns';
import { type Result, err, ok } from 'neverthrow';
import { enqueueTask } from '../../lib/dbHelper';
import type { VRChatPlayerJoinLog } from '../vrchatLog/service';
import * as model from './playerJoinInfoLog.model';

/**
 * プレイヤー参加ログに関するエラー型
 */
type PlayerJoinLogError =
  | { type: 'DATABASE_ERROR'; message: string }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'INVALID_DATE_RANGE'; message: string };

/**
 * VRChatのプレイヤー参加ログを作成する
 * @param playerJoinLogList プレイヤー参加ログのリスト
 * @returns 作成されたプレイヤー参加ログのリスト
 */
export const createVRChatPlayerJoinLogModel = (
  playerJoinLogList: VRChatPlayerJoinLog[],
) => {
  return model.createVRChatPlayerJoinLog(playerJoinLogList);
};

/**
 * プレイヤー参加ログのデータ型
 */
type PlayerJoinLogData = {
  id: string;
  playerId: string | null;
  playerName: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 参加日時の範囲からVRChatのプレイヤー参加ログを取得する
 * @param props.startJoinDateTime 開始日時
 * @param props.endJoinDateTime 終了日時（nullの場合は開始日時から7日間）
 * @returns プレイヤー参加ログのリスト
 */

export const getVRChatPlayerJoinLogListByJoinDateTime = async (props: {
  startJoinDateTime: Date;
  endJoinDateTime: Date | null;
}): Promise<Result<PlayerJoinLogData[], PlayerJoinLogError>> => {
  // 日付範囲の検証
  if (
    props.endJoinDateTime &&
    props.startJoinDateTime > props.endJoinDateTime
  ) {
    return err({
      type: 'INVALID_DATE_RANGE',
      message: '開始日時は終了日時より前である必要があります',
    });
  }

  let modelList: model.VRChatPlayerJoinLogModel[];

  // 終了日時が指定されていない場合は開始日時から7日間のログを取得
  if (!props.endJoinDateTime) {
    const endDate = datefns.addDays(props.startJoinDateTime, 7);
    const result = await enqueueTask(() =>
      model.getVRChatPlayerJoinLogListByJoinDateTime({
        gteJoinDateTime: props.startJoinDateTime,
        ltJoinDateTime: endDate,
        getUntilDays: null,
      }),
    );

    if (result.isErr()) {
      // データベースエラーの場合は具体的なエラーを返す
      return err({
        type: 'DATABASE_ERROR',
        message: `プレイヤー参加ログの取得に失敗しました: ${result.error.message}`,
      });
    }

    modelList = result.value as model.VRChatPlayerJoinLogModel[];
  } else {
    const endDate: Date = props.endJoinDateTime;
    const result = await enqueueTask(() =>
      model.getVRChatPlayerJoinLogListByJoinDateTime({
        gteJoinDateTime: props.startJoinDateTime,
        ltJoinDateTime: endDate,
        getUntilDays: null,
      }),
    );

    if (result.isErr()) {
      // データベースエラーの場合は具体的なエラーを返す
      return err({
        type: 'DATABASE_ERROR',
        message: `プレイヤー参加ログの取得に失敗しました: ${result.error.message}`,
      });
    }

    modelList = result.value as model.VRChatPlayerJoinLogModel[];
  }

  // 結果が空の場合は空の配列を返す（エラーではない）
  return ok(
    modelList.map((model) => ({
      id: model.id,
      playerId: model.playerId,
      playerName: model.playerName,
      joinDateTime: model.joinDateTime,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    })),
  );
};

/**
 * 最新の検出日時を取得する
 * @returns 最新の検出日時（ISO文字列）
 */
export const getLatestDetectedDate = async (): Promise<
  Result<string | null, PlayerJoinLogError>
> => {
  const result = await enqueueTask(() => model.findLatestPlayerJoinLog());

  if (result.isErr()) {
    return err({
      type: 'DATABASE_ERROR',
      message: `最新の検出日時の取得に失敗しました: ${result.error.message}`,
    });
  }

  const latestLog = result.value as model.VRChatPlayerJoinLogModel | null;
  return ok(latestLog?.joinDateTime.toISOString() ?? null);
};

/**
 * 最新のプレイヤー参加ログを取得する
 * @returns 最新のプレイヤー参加ログ
 */
export const findLatestPlayerJoinLog = async (): Promise<
  Result<model.VRChatPlayerJoinLogModel | null, PlayerJoinLogError>
> => {
  const result = await enqueueTask(() => model.findLatestPlayerJoinLog());

  if (result.isErr()) {
    return err({
      type: 'DATABASE_ERROR',
      message: `最新のプレイヤー参加ログの取得に失敗しました: ${result.error.message}`,
    });
  }

  return ok(result.value);
};
