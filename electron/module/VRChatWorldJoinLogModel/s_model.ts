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

import type { VRChatWorldJoinLog } from '../vrchatLog/service';

const WorldInstanceIdJoinDateTimeIndex = createIndexDecorator(
  'WorldInstanceIdJoinDateTimeIndex',
  {
    name: 'worldInstanceId-joinDateTime',
    type: 'fulltext',
    concurrently: true,
    unique: true,
  },
);

export class VRChatWorldJoinLogModel extends Model<
  InferAttributes<VRChatWorldJoinLogModel>,
  InferCreationAttributes<VRChatWorldJoinLogModel>
> {
  @Attribute(DataTypes.UUIDV4)
  @PrimaryKey
  @Default(sql.uuidV4)
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare worldId: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare worldName: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  @WorldInstanceIdJoinDateTimeIndex
  declare worldInstanceId: string;

  @Attribute(DataTypes.DATE)
  @NotNull
  @WorldInstanceIdJoinDateTimeIndex
  declare joinDateTime: Date;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const createVRChatWorldJoinLog = async (
  vrchatWorldJoinLogList: VRChatWorldJoinLog[],
) => {
  const existingLogs = await VRChatWorldJoinLogModel.findAll({
    attributes: ['joinDateTime', 'worldInstanceId'],
  });

  const existingSet = new Set(
    existingLogs.map(
      (log) => `${log.joinDateTime.toISOString()}|${log.worldInstanceId}`,
    ),
  );

  const newLogs = vrchatWorldJoinLogList
    .filter((logInfo) => {
      const key = `${logInfo.joinDate.toISOString()}|${
        logInfo.worldInstanceId
      }`;
      return !existingSet.has(key);
    })
    .map((logInfo) => ({
      joinDateTime: logInfo.joinDate,
      worldId: logInfo.worldId,
      worldInstanceId: logInfo.worldInstanceId,
      worldName: logInfo.worldName,
    }));

  if (newLogs.length > 0) {
    const vrchatWorldJoinLog =
      await VRChatWorldJoinLogModel.bulkCreate(newLogs);

    return vrchatWorldJoinLog;
  }
};

export const findAllVRChatWorldJoinLogList = async () => {
  const vrchatWorldJoinLogList = await VRChatWorldJoinLogModel.findAll({
    order: [['joinDateTime', 'DESC']],
  });
  return vrchatWorldJoinLogList;
};

/**
 * 指定した日時から計算して直前にjoinしたワールドの情報を取得する
 */
export const findRecentVRChatWorldJoinLog = async (dateTime: Date) => {
  const vrchatWorldJoinLog = await VRChatWorldJoinLogModel.findOne({
    where: {
      joinDateTime: {
        [Op.lte]: dateTime,
      },
    },
    order: [['joinDateTime', 'DESC']],
  });

  return vrchatWorldJoinLog;
};

/**
 * 指定した日時から計算して直後にjoinしたワールドの情報を取得する
 */
export const findNextVRChatWorldJoinLog = async (dateTime: Date) => {
  const vrchatWorldJoinLog = await VRChatWorldJoinLogModel.findOne({
    where: {
      joinDateTime: {
        [Op.gt]: dateTime,
      },
    },
    order: [['joinDateTime', 'ASC']],
  });

  return vrchatWorldJoinLog;
};
