import * as path from 'path';
import * as type from './type';
// import { getSettingStore } from '../settingStore';
// import {
//   getVRChatPhotoFolderYearMonthList,
//   getVRChatPhotoItemPathListByYearMonth,
// } from './vrchatPhoto/service';
// import { readDirSyncSafe } from '../lib/wrappedFs';

// const settingStore = getSettingStore('test-settings');

// readDirSyncSafe の結果を mock する
// jest.mock('../lib/wrappedFs', () => {
//   const originalModule = jest.requireActual('../lib/wrappedFs');
//   return {
//     __esModule: true,
//     ...originalModule,
//     readDirSyncSafe: jest.fn().mockReturnValue({
//       isErr: () => false,
//       isOk: () => true,
//       value: ['2023-11'],
//   }),
//   };
// });

// describe('viewer', () => {
//   beforeEach(async () => {
//     await settingStore.clearAllStoredSettings();
//     await settingStore.setVRChatPhotoDir(
//       '/testPath/VRChat',
//     );
//   });
//   it('should be defined', () => {
//     const VrcPhotoPath = settingStore.getVRChatPhotoDir();
//     console.log(VrcPhotoPath);
//     expect(VrcPhotoPath).toStrictEqual(
//       '/testPath/VRChat',
//     );
//     const yearMonthList = getVRChatPhotoFolderYearMonthList({
//       storedPath: VrcPhotoPath,
//     })._unsafeUnwrap();
//     const { year, month } = yearMonthList[0];
//     const vrcPhotoPathList = getVRChatPhotoItemPathListByYearMonth({
//       year,
//       month,
//       storedVRCPhotoDir: VrcPhotoPath,
//     })._unsafeUnwrap();
//     console.log(vrcPhotoPathList);

//     const infoFileName: string[] = [];
//     for (const vrcPhotoPath of vrcPhotoPathList) {
//       const fileName = path.basename(vrcPhotoPath);
//       const parseResult = t.JoinInfoFileNameSchema.safeParse(
//         fileName
//           .replace(/\.png$/, '')
//           .replace(/\.jpg$/, '')
//           .replace(/\.jpeg$/, ''),
//       );
//       if (parseResult.success) {
//         infoFileName.push(vrcPhotoPath);
//       }
//     }

//     console.log(infoFileName);
//     expect(infoFileName.length).toBeGreaterThan(0);
//   });
// });

describe('viewer_api', () => {
  it('ワールド情報を取得する', async () => {
    const infoFilePath =
      '/workspaces/add-world-name-to-vrc-photo/debug/photos/VRChat/2023-11/VRChat_2023-11-08_15-11-32.000_wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f.jpeg';
    const infoFileNameWithoutExt = path
      .basename(infoFilePath)
      .replace(/\.[^/.]+$/, '');
    const worldId = type
      .parseJoinInfoFileName(infoFileNameWithoutExt)
      ._unsafeUnwrap().worldId;
    // api で world 情報を取得する
    const reqUrl = `https://api.vrchat.cloud/api/1/worlds/${worldId}`;
    const res = await fetch(reqUrl);
    const worldInfo = await res.json();
    expect(worldInfo.id).toBe(worldId);
    expect(typeof worldInfo.name).toBe('string');
  });
});
