import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Op,
} from '@sequelize/core';
import {
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
  Table,
  createIndexDecorator,
} from '@sequelize/core/decorators-legacy';
import { uuidv7 } from 'uuidv7';

import type { VRChatWorldJoinLog } from '../../vrchatLog/service';

const WorldInstanceIdJoinDateTimeIndex = createIndexDecorator(
  'WorldInstanceIdJoinDateTimeIndex',
  {
    name: 'worldInstanceId-joinDateTime',
    type: 'fulltext',
    concurrently: true,
    unique: true,
  },
);

@Table({ tableName: 'VRChatWorldJoinLogModels' })
export class VRChatWorldJoinLogModel extends Model<
  InferAttributes<VRChatWorldJoinLogModel>,
  InferCreationAttributes<VRChatWorldJoinLogModel>
> {
  @Attribute(DataTypes.UUID)
  @PrimaryKey
  @Default(uuidv7)
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

  @Attribute(DataTypes.DATE)
  @Default(DataTypes.NOW)
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const createVRChatWorldJoinLog = async (
  vrchatWorldJoinLogList: VRChatWorldJoinLog[],
): Promise<VRChatWorldJoinLogModel[]> => {
  const newLogs = vrchatWorldJoinLogList.map((logInfo) => ({
    joinDateTime: logInfo.joinDate,
    worldId: logInfo.worldId.value,
    worldInstanceId: logInfo.worldInstanceId.value,
    worldName: logInfo.worldName.value,
  }));

  if (newLogs.length > 0) {
    const vrchatWorldJoinLog = await VRChatWorldJoinLogModel.bulkCreate(
      newLogs,
      {
        ignoreDuplicates: true,
        validate: true,
      },
    );

    return vrchatWorldJoinLog;
  }

  return [];
};

export const findAllVRChatWorldJoinLogList = async () => {
  const vrchatWorldJoinLogList = await VRChatWorldJoinLogModel.findAll({
    order: [['joinDateTime', 'DESC']],
  });
  return vrchatWorldJoinLogList;
};

/**
 * VRChatでのWorldJoin記録を取得する
 */
export const findVRChatWorldJoinLogList = async (query?: {
  gtJoinDateTime?: Date;
  ltJoinDateTime?: Date;
  orderByJoinDateTime: 'asc' | 'desc';
}): Promise<VRChatWorldJoinLogModel[]> => {
  const vrcWorldJoinLogModelList = await VRChatWorldJoinLogModel.findAll({
    where: {
      joinDateTime: {
        ...(query?.gtJoinDateTime && { [Op.gt]: query.gtJoinDateTime }),
        ...(query?.ltJoinDateTime && { [Op.lt]: query.ltJoinDateTime }),
      },
    },
    order: [['joinDateTime', query?.orderByJoinDateTime ?? 'asc']],
  });

  return vrcWorldJoinLogModelList;
};

/**
 * 指定した日時から計算して直前にjoinしたワールドの情報を取得する
 */
export const findRecentVRChatWorldJoinLog = async (props: {
  dateTime: Date;
}) => {
  const vrchatWorldJoinLog = await VRChatWorldJoinLogModel.findOne({
    where: {
      joinDateTime: {
        [Op.lte]: props.dateTime,
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

export const findLatestWorldJoinLog = async () => {
  return VRChatWorldJoinLogModel.findOne({
    order: [['joinDateTime', 'DESC']],
  });
};
