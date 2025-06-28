import * as datefns from 'date-fns';
import { z } from 'zod';
import { BaseValueObject } from '../../electron/lib/baseValueObject.js';

/**
 * VRChatの写真ファイル名
 * VRChat_2023-10-01_03-01-18.551_2560x1440.png
 *
 * @see docs/photo-grouping-logic.md - 写真グループ化ロジック
 * @see electron/module/vrchatPhoto/model/vrchatPhotoPath.model.ts
 */
class VRChatPhotoFileNameWithExt extends BaseValueObject<
  'VRChatPhotoFileNameWithExt',
  string
> {
  // 写真の撮影日時
  public get photoTakenDateTime(): Date {
    // local time
    const dateTimeStr = this.value.match(
      /\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3}/,
    );
    if (dateTimeStr === null) {
      throw new Error(`Invalid VRChat photo file name: ${this.value}`);
    }
    return datefns.parse(dateTimeStr[0], 'yyyy-MM-dd_HH-mm-ss.SSS', new Date());
  }
}

export type { VRChatPhotoFileNameWithExt };

export const VRChatPhotoFileNameWithExtSchema = z
  .string()
  .regex(
    /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3}_\d+x\d+\.[a-z]+$/,
    'Invalid VRChat photo file name',
  )
  .transform((value) => {
    return new VRChatPhotoFileNameWithExt(value);
  });
