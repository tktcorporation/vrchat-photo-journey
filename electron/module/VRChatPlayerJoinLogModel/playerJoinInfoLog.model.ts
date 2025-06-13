import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Op,
} from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
  Table,
  createIndexDecorator,
} from '@sequelize/core/decorators-legacy';
import * as dateFns from 'date-fns';
import { uuidv7 } from 'uuidv7';

import type { VRChatPlayerJoinLog } from '../vrchatLog/service';

const PlayerNameJoinDateTimeIndex = createIndexDecorator(
  'PlayerNameJoinDateTimeIndex',
  {
    name: 'playerName-joinDateTime',
    concurrently: true,
    unique: true,
  },
);

const JoinDateTimeIndex = createIndexDecorator('JoinDateTimeIndex', {
  name: 'joinDateTime-idx',
  concurrently: true,
});

@Table({ tableName: 'VRChatPlayerJoinLogModels' })
export class VRChatPlayerJoinLogModel extends Model<
  InferAttributes<VRChatPlayerJoinLogModel>,
  InferCreationAttributes<VRChatPlayerJoinLogModel>
> {
  @Attribute(DataTypes.UUID)
  @PrimaryKey
  @Default(uuidv7)
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  @AllowNull
  declare playerId: string | null;

  @Attribute(DataTypes.STRING)
  @NotNull
  @PlayerNameJoinDateTimeIndex
  declare playerName: string;

  @Attribute(DataTypes.DATE)
  @NotNull
  @PlayerNameJoinDateTimeIndex
  @JoinDateTimeIndex
  declare joinDateTime: Date;

  @Attribute(DataTypes.DATE)
  @Default(DataTypes.NOW)
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

/**
 * 重複を除外しつつプレイヤー参加ログを一括登録する
 * サービス層の createVRChatPlayerJoinLogModel から利用される
 */
export const createVRChatPlayerJoinLog = async (
  playerJoinLogList: VRChatPlayerJoinLog[],
): Promise<VRChatPlayerJoinLogModel[]> => {
  const existingLogs = await VRChatPlayerJoinLogModel.findAll({
    attributes: ['joinDateTime', 'playerName'],
  });

  const existingSet = new Set(
    existingLogs.map(
      (log) => `${log.joinDateTime.toISOString()}|${log.playerName}`,
    ),
  );

  const seen = new Set();
  const newLogsExcludeDup = playerJoinLogList
    .filter((logInfo) => {
      const key = `${logInfo.joinDate.toISOString()}|${
        typeof logInfo.playerName === 'string'
          ? logInfo.playerName
          : logInfo.playerName.value
      }`;
      if (existingSet.has(key) || seen.has(key)) {
        return false; // 既存セットまたは新しいセットに重複が見つかった場合は除外
      }
      seen.add(key); // 初めて見た組み合わせを新しいセットに追加
      return true; // ユニークな組み合わせの場合は残す
    })
    .map((logInfo) => ({
      joinDateTime: logInfo.joinDate,
      playerId:
        (typeof logInfo.playerId === 'string'
          ? logInfo.playerId
          : logInfo.playerId?.value) ?? null,
      playerName:
        typeof logInfo.playerName === 'string'
          ? logInfo.playerName
          : logInfo.playerName.value,
    }));

  if (newLogsExcludeDup.length < 1) {
    return [];
  }
  return await VRChatPlayerJoinLogModel.bulkCreate(newLogsExcludeDup);
};

/**
 * joinDateTime を２つ取得して、その間にある playerJoinLog を取得する
 * endJoinDateTime がない場合は以降のデータを最大n日分取得する
 */
export const getVRChatPlayerJoinLogListByJoinDateTime = async (
  props:
    | {
        gteJoinDateTime: Date;
        ltJoinDateTime: Date;
        getUntilDays: null;
      }
    | {
        gteJoinDateTime: Date;
        ltJoinDateTime: null;
        // endJoinDateTime がない場合は以降のデータを最大n日分取得する
        getUntilDays: number;
      },
): Promise<VRChatPlayerJoinLogModel[]> => {
  if (props.ltJoinDateTime === null) {
    const playerJoinLogList = await VRChatPlayerJoinLogModel.findAll({
      where: {
        joinDateTime: {
          [Op.gte]: props.gteJoinDateTime,
          [Op.lt]: dateFns.addDays(props.gteJoinDateTime, props.getUntilDays),
        },
      },
    });
    return playerJoinLogList;
  }
  const playerJoinLogList = await VRChatPlayerJoinLogModel.findAll({
    where: {
      joinDateTime: {
        [Op.gte]: props.gteJoinDateTime,
        [Op.lt]: props.ltJoinDateTime,
      },
    },
  });
  return playerJoinLogList;
};

/**
 * 最後に検出されたプレイヤー参加ログを取得する
 * ログ同期の進捗確認に使用される
 */
export const findLatestPlayerJoinLog = async () => {
  return VRChatPlayerJoinLogModel.findOne({
    order: [['joinDateTime', 'DESC']],
  });
};
