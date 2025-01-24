import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  Default,
  NotNull,
  PrimaryKey,
} from '@sequelize/core/decorators-legacy';
import { uuidv7 } from 'uuidv7';

export class VRChatPlayerLeaveLogModel extends Model<
  InferAttributes<VRChatPlayerLeaveLogModel>,
  InferCreationAttributes<VRChatPlayerLeaveLogModel>
> {
  @Attribute(DataTypes.UUID)
  @PrimaryKey
  @Default(uuidv7)
  declare id: CreationOptional<string>;

  @Attribute(DataTypes.DATE)
  @NotNull
  declare leaveDateTime: Date;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare playerName: string;

  @Attribute(DataTypes.STRING)
  @AllowNull
  declare playerId: string | null;

  @Attribute(DataTypes.DATE)
  @Default(DataTypes.NOW)
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
