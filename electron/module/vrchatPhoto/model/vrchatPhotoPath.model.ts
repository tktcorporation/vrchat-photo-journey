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
  Index,
  NotNull,
  PrimaryKey,
} from '@sequelize/core/decorators-legacy';

export class VRChatPhotoPathModel extends Model<
  InferAttributes<VRChatPhotoPathModel>,
  InferCreationAttributes<VRChatPhotoPathModel>
> {
  @Attribute(DataTypes.UUIDV4)
  @PrimaryKey
  @Default(sql.uuidV4)
  declare id: CreationOptional<string>;

  // TODO: world id をここに入れる必要はある？
  // もしくは join log に紐づける？

  @Attribute(DataTypes.STRING)
  @NotNull
  @Index({ unique: true })
  declare photoPath: string;

  @Attribute(DataTypes.DATE)
  @NotNull
  declare photoTakenAt: Date;

  // declare fileCreatedAt: Date;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export interface VRChatPhotoPathCreationAttributes {
  photoPath: string;
  photoTakenAt: Date;
}

export const createOrUpdateListVRChatPlayerJoinLog = async (
  attributes: VRChatPhotoPathCreationAttributes[],
): Promise<void> => {
  await VRChatPhotoPathModel.bulkCreate(
    attributes.map((attribute) => ({
      photoPath: attribute.photoPath,
      photoTakenAt: attribute.photoTakenAt,
    })),
    {
      updateOnDuplicate: ['photoPath', 'photoTakenAt'], // 更新するフィールドを指定
    },
  );
};

/**
 * VRChatの写真の保存pathを取得する
 */
export const getVRChatPhotoPathList = async (query?: {
  gtJoinDateTime?: Date;
  ltJoinDateTime?: Date;
}): Promise<VRChatPhotoPathModel[]> => {
  const photoPathList = await VRChatPhotoPathModel.findAll({
    where: {
      photoTakenAt: {
        ...(query?.gtJoinDateTime && { [Op.gt]: query.gtJoinDateTime }),
        ...(query?.ltJoinDateTime && { [Op.lt]: query.ltJoinDateTime }),
      },
    },
    attributes: ['photoPath', 'photoTakenAt'],
  });

  return photoPathList;
};
