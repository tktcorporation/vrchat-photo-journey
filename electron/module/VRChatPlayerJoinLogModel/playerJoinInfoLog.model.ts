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
  await VRChatPlayerJoinLogModel.bulkCreate(
    playerJoinLogList.map((playerJoinLog) => {
      return {
        playerName: playerJoinLog.playerName,
        joinDateTime: playerJoinLog.joinDate,
      };
    }),
    {
      updateOnDuplicate: ['joinDateTime', 'playerName'],
    },
  );
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
