import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from '@sequelize/core';
import {
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
} from '@sequelize/core/decorators-legacy';
import { uuidv7 } from 'uuidv7';

import type { WorldId } from '../vrchatLog/type';

export interface VRChatWorldJoinLogFromPhoto {
  joinDate: Date;
  worldId: WorldId;
}

export class VRChatWorldJoinLogFromPhotoModel extends Model<
  InferAttributes<VRChatWorldJoinLogFromPhotoModel>,
  InferCreationAttributes<VRChatWorldJoinLogFromPhotoModel>
> {
  @Attribute(DataTypes.UUID)
  @PrimaryKey
  @Default(uuidv7)
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare worldId: WorldId;

  @Attribute(DataTypes.DATE)
  @NotNull
  declare joinDateTime: Date;

  @Attribute(DataTypes.DATE)
  @Default(DataTypes.NOW)
  @NotNull
  declare createdAt: CreationOptional<Date>;

  @Attribute(DataTypes.DATE)
  declare updatedAt: CreationOptional<Date>;
}

export const createVRChatWorldJoinLogFromPhoto = async (
  vrchatWorldJoinLogFromPhotoList: VRChatWorldJoinLogFromPhoto[],
): Promise<VRChatWorldJoinLogFromPhotoModel[]> => {
  const newLogs = vrchatWorldJoinLogFromPhotoList.map((logInfo) => ({
    joinDateTime: logInfo.joinDate,
    worldId: logInfo.worldId,
  }));

  if (newLogs.length === 0) {
    return [];
  }

  const vrchatWorldJoinLog = await VRChatWorldJoinLogFromPhotoModel.bulkCreate(
    newLogs,
    {
      ignoreDuplicates: true,
      validate: true,
    },
  );

  return vrchatWorldJoinLog;
};
