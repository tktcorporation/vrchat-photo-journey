import type { VRChatPhotoFileNameWithExt } from './../../../electron/module/logInfo/valueObjects';

export interface Photo {
  id: number | string;
  url: string;
  fileNameWithExt: VRChatPhotoFileNameWithExt;
  width: number;
  height: number;
  takenAt: Date;
  location: {
    joinedAt: Date;
  };
}
