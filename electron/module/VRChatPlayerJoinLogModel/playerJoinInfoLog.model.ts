import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Op,
  sql,
} from '@sequelize/core';
import {
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
  createIndexDecorator,
} from '@sequelize/core/decorators-legacy';
import * as dateFns from 'date-fns';

import type { VRChatPlayerJoinLog } from '../vrchatLog/service';

const PlayerNameJoinDateTimeIndex = createIndexDecorator(
  'PlayerNameJoinDateTimeIndex',
  {
    name: 'playerName-joinDateTime',
    type: 'fulltext',
    concurrently: true,
    unique: true,
  },
);

export class VRChatPlayerJoinLogModel extends Model<
  InferAttributes<VRChatPlayerJoinLogModel>,
  InferCreationAttributes<VRChatPlayerJoinLogModel>
> {
  @Attribute(DataTypes.UUIDV4)
  @PrimaryKey
  @Default(sql.uuidV4)
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  declare playerId: string | null;

  @Attribute(DataTypes.STRING)
  @NotNull
  @PlayerNameJoinDateTimeIndex
  declare playerName: string;

  @Attribute(DataTypes.DATE)
  @NotNull
  @PlayerNameJoinDateTimeIndex
  declare joinDateTime: Date;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const createVRChatPlayerJoinLog = async (
  playerJoinLogList: VRChatPlayerJoinLog[],
): Promise<void> => {
  const existingLogs = await VRChatPlayerJoinLogModel.findAll({
    attributes: ['joinDateTime', 'playerName'],
  });

  const existingSet = new Set(
    existingLogs.map(
      (log) => `${log.joinDateTime.toISOString()}|${log.playerName}`,
    ),
  );

  const newLogs = playerJoinLogList
    .filter((logInfo) => {
      const key = `${logInfo.joinDate.toISOString()}|${logInfo.playerName}`;
      return !existingSet.has(key);
    })
    .map((logInfo) => ({
      joinDateTime: logInfo.joinDate,
      playerName: logInfo.playerName,
    }));

  if (newLogs.length > 0) {
    await VRChatPlayerJoinLogModel.bulkCreate(newLogs);
  }
};

/**
 * joinDateTime を２つ取得して、その間にある playerJoinLog を取得する
 * endJoinDateTime がない場合は以降のデータを最大n日分取得する
 */
export const getVRChatPlayerJoinLogListByJoinDateTime = async (
  props:
    | {
        startJoinDateTime: Date;
        endJoinDateTime: Date;
        getUntilDays: null;
      }
    | {
        startJoinDateTime: Date;
        endJoinDateTime: null;
        // endJoinDateTime がない場合は以降のデータを最大n日分取得する
        getUntilDays: number;
      },
): Promise<VRChatPlayerJoinLogModel[]> => {
  if (props.endJoinDateTime === null) {
    const playerJoinLogList = await VRChatPlayerJoinLogModel.findAll({
      where: {
        joinDateTime: {
          [Op.between]: [
            props.startJoinDateTime,
            dateFns.addDays(props.startJoinDateTime, 7),
          ],
        },
      },
    });
    return playerJoinLogList;
  }
  const playerJoinLogList = await VRChatPlayerJoinLogModel.findAll({
    where: {
      joinDateTime: {
        [Op.between]: [props.startJoinDateTime, props.endJoinDateTime],
      },
    },
  });
  return playerJoinLogList;
};
