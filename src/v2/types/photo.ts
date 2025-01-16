import type { VRChatPhotoFileNameWithExt } from './../../../shared/valueObjects';

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
