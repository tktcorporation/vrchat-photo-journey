import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Op,
  sql,
} from '@sequelize/core';
import { col, fn, literal } from '@sequelize/core';
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
  gtPhotoTakenAt?: Date;
  ltPhotoTakenAt?: Date;
  orderByPhotoTakenAt: 'asc' | 'desc';
}): Promise<VRChatPhotoPathModel[]> => {
  const photoPathList = await VRChatPhotoPathModel.findAll({
    where: {
      photoTakenAt: {
        ...(query?.gtPhotoTakenAt && { [Op.gt]: query.gtPhotoTakenAt }),
        ...(query?.ltPhotoTakenAt && { [Op.lt]: query.ltPhotoTakenAt }),
      },
    },
    order: [['photoTakenAt', query?.orderByPhotoTakenAt ?? 'asc']],
  });

  return photoPathList;
};

/**
 * photoPath の完全一致でレコードを取得する
 */
export const getVRChatPhotoPathByPhotoPath = async (
  photoPath: string,
): Promise<VRChatPhotoPathModel | null> => {
  return VRChatPhotoPathModel.findOne({
    where: { photoPath },
  });
};

export const deleteVRChatPhotoPathModel = async (
  photoPathModel: VRChatPhotoPathModel,
): Promise<void> => {
  await photoPathModel.destroy();
};

export const getCountByYearMonthList = async (): Promise<
  {
    photoTakenYear: number;
    photoTakenMonth: number;
    photoCount: number;
  }[]
> => {
  const countResult = await VRChatPhotoPathModel.findAll({
    attributes: [
      [fn('strftime', '%Y-%m', col('photoTakenAt')), 'yearMonth'],
      [fn('COUNT', col('id')), 'photoCount'],
    ],
    group: [literal('yearMonth')],
    order: [[literal('yearMonth'), 'DESC']],
  });

  const converted = countResult.map((record) => ({
    yearMonth: record.get('yearMonth'),
    photoCount: record.get('photoCount'),
  }));

  return converted.map(({ yearMonth, photoCount }) => {
    if (typeof yearMonth !== 'string') {
      throw new Error(`assertion error: ${yearMonth}`);
    }
    const [year, month] = yearMonth.split('-').map(Number);
    if (typeof photoCount !== 'number') {
      throw new Error(`assertion error: ${photoCount}`);
    }
    return { photoTakenYear: year, photoTakenMonth: month, photoCount };
  });
};
