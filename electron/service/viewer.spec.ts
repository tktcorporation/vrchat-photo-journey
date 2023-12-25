/* eslint-disable */

import * as path from 'path';
import * as settingStore from '../settingStore';
import * as t from './type';
import {
  getVRChatPhotoFolderYearMonthList,
  getVRChatPhotoItemPathListByYearMonth,
} from './vrchatPhoto/service';

// getVRChatPhotoDir の結果を mock する
jest.mock('../settingStore', () => {
  return {
    getVRChatPhotoDir: jest
      .fn()
      .mockReturnValue(
        '/workspaces/add-world-name-to-vrc-photo/debug/photos/VRChat',
      ),
  };
});

describe('viewer', () => {
  it('should be defined', () => {
    const VrcPhotoPath = settingStore.getVRChatPhotoDir();
    console.log(VrcPhotoPath);
    expect(VrcPhotoPath).toStrictEqual(
      '/workspaces/add-world-name-to-vrc-photo/debug/photos/VRChat',
    );
    const yearMonthList = getVRChatPhotoFolderYearMonthList()._unsafeUnwrap();
    const { year, month } = yearMonthList[0];
    const vrcPhotoPathList = getVRChatPhotoItemPathListByYearMonth(
      year,
      month,
    )._unsafeUnwrap();
    console.log(vrcPhotoPathList);

    const infoFileName: string[] = [];
    for (const vrcPhotoPath of vrcPhotoPathList) {
      const fileName = path.basename(vrcPhotoPath);
      const parseResult = t.JoinInfoFileNameSchema.safeParse(
        fileName
          .replace(/\.png$/, '')
          .replace(/\.jpg$/, '')
          .replace(/\.jpeg$/, ''),
      );
      if (parseResult.success) {
        infoFileName.push(vrcPhotoPath);
      }
    }

    console.log(infoFileName);
    expect(infoFileName.length).toBeGreaterThan(0);
  });
});

describe('viewer_api', () => {
  it('ワールド情報を取得する', async () => {
    const infoFilePath =
      '/workspaces/add-world-name-to-vrc-photo/debug/photos/VRChat/2023-11/VRChat_2023-11-08_15-11-32.000_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f.jpeg';
    const infoFileNameWithoutExt = path
      .basename(infoFilePath)
      .replace(/\.[^/.]+$/, '');
    const worldId = t
      .parseJoinInfoFileName(infoFileNameWithoutExt)
      ._unsafeUnwrap().worldId;
    // api で world 情報を取得する
    const reqUrl = `https://api.vrchat.cloud/api/1/worlds/wrld_${worldId}`;
    console.log(reqUrl);
    const res = await fetch(reqUrl);
    const worldInfo = await res.json();
    console.log(worldInfo);
  });
});
