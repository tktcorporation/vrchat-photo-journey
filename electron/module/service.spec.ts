import * as neverthrow from 'neverthrow';
import { getService } from './service';
import { getSettingStore } from './settingStore';

describe('getVrcWorldInfoByWorldId', () => {
  it('正常系', async () => {
    const service = getService(getSettingStore('test-settings'));
    const result = await service.getVrcWorldInfoByWorldId(
      'wrld_8e90c7e1-5ad5-4e1b-8ff6-9fa673a3d83b',
    );
    if (result.isErr()) {
      throw result.error;
    }
    expect(result.value).toEqual({
      name: 'first',
    });
  });
  it('異常系', async () => {
    const service = getService(getSettingStore('test-settings'));
    const result = await service.getVrcWorldInfoByWorldId('wrld_0000');
    if (result.isOk()) {
      throw new Error('not error');
    }
    expect(result.error.message).toBe('getVrcWorldInfoByWorldId: Not Found');
  });
});

describe('settingStore', () => {
  describe('removeAdjacentDuplicateWorldEntriesFlag', () => {
    it('should return default value', async () => {
      const service = getService(getSettingStore('test-settings'));
      await service.clearAllStoredSettings();
      const result = (
        await service.getRemoveAdjacentDuplicateWorldEntriesFlag()
      ).unwrapOr('broken');
      expect(result).toBe(false);
    });
    it('should return set value', async () => {
      const service = getService(getSettingStore('test-settings'));
      await service.clearAllStoredSettings();
      await service.setRemoveAdjacentDuplicateWorldEntriesFlag(true);
      const result = await (
        await service.getRemoveAdjacentDuplicateWorldEntriesFlag()
      ).unwrapOr('broken');
      expect(result).toBe(true);
    });
  });
});

describe('getVRChatJoinInfoWithVRChatPhotoList', () => {
  type DateTime = {
    date: {
      year: string;
      month: string;
      day: string;
    };
    time: {
      hour: string;
      minute: string;
      second: string;
      millisecond: string;
    };
  };
  type PhotoAndJoin = neverthrow.Result<
    (
      | {
          type: 'PHOTO';
          datetime: DateTime;
          path: string;
          worldId: null;
        }
      | {
          type: 'JOIN';
          datetime: DateTime;
          path: string;
          worldId: string;
        }
    )[],
    Error
  >;
  const createDatetimeByDate = (date: Date) => {
    return {
      date: {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        day: date.getDate().toString().padStart(2, '0'),
      },
      time: {
        hour: date.getHours().toString().padStart(2, '0'),
        minute: date.getMinutes().toString().padStart(2, '0'),
        second: date.getSeconds().toString().padStart(2, '0'),
        millisecond: date.getMilliseconds().toString().padStart(3, '0'),
      },
    };
  };
  it('createDatetimeByDate', () => {
    const result = createDatetimeByDate(new Date('2023-01-01T14:15:00.000Z'));
    expect(result).toEqual({
      date: {
        year: '2023',
        month: '01',
        day: '01',
      },
      time: {
        hour: '14',
        minute: '15',
        second: '00',
        millisecond: '000',
      },
    });
  });
  // テスト用の設定を使う
  const { getVRChatJoinInfoWithVRChatPhotoList } = getService(
    getSettingStore('test-settings'),
  );
  it('ちゃんとネストされる', () => {
    // テスト用DI関数を用意
    const getVRChatPhotoWithWorldIdAndDate = ({
      year,
      month,
    }: { year: string; month: string }): PhotoAndJoin => {
      return neverthrow.ok([
        {
          type: 'PHOTO',
          path: `${year}-${month}/photo`,
          worldId: null,
          datetime: createDatetimeByDate(new Date('2023-12-13T15:00:00.000Z')),
        },
        {
          type: 'JOIN',
          path: `${year}-${month}/join`,
          worldId: 'wrld_1234567890',
          datetime: createDatetimeByDate(new Date('2023-12-13T14:00:00.000Z')),
        },
      ]);
    };
    // 関数の戻りが正しいかテスト
    const result = getVRChatJoinInfoWithVRChatPhotoList({
      getVRChatPhotoWithWorldIdAndDate,
    })({ year: '2023', month: '12' });
    if (result.isErr()) {
      throw result.error;
    }
    expect(result.value).toEqual([
      {
        joinDatetime: new Date('2023-12-13T14:00:00.000Z'),
        worldId: 'wrld_1234567890',
        imgPath: '2023-12/join',
        photoList: [
          {
            datetime: new Date('2023-12-13T15:00:00.000Z'),
            path: '2023-12/photo',
          },
        ],
      },
    ]);
  });
  it('JOINごとにまとまっている PHOTOは直前のJOINにまとまる', () => {
    // テスト用DI関数を用意
    const getVRChatPhotoWithWorldIdAndDate = ({
      year,
      month,
    }: { year: string; month: string }): PhotoAndJoin => {
      return neverthrow.ok([
        {
          type: 'JOIN',
          path: `${year}-${month}/join1`,
          worldId: 'wrld_1234567890',
          datetime: createDatetimeByDate(new Date('2023-12-13T12:00:00.000Z')),
        },
        {
          type: 'PHOTO',
          path: `${year}-${month}/photo2`,
          worldId: null,
          datetime: createDatetimeByDate(new Date('2023-12-13T16:00:00.000Z')),
        },
        {
          type: 'JOIN',
          path: `${year}-${month}/join2`,
          worldId: 'wrld_1234567890',
          datetime: createDatetimeByDate(new Date('2023-12-13T14:00:00.000Z')),
        },
        {
          type: 'PHOTO',
          path: `${year}-${month}/photo1`,
          worldId: null,
          datetime: createDatetimeByDate(new Date('2023-12-13T15:00:00.000Z')),
        },
        {
          type: 'JOIN',
          path: `${year}-${month}/join3`,
          worldId: 'wrld_1234567890',
          datetime: createDatetimeByDate(new Date('2023-12-13T18:00:00.000Z')),
        },
        {
          type: 'PHOTO',
          path: `${year}-${month}/photo3`,
          worldId: null,
          datetime: createDatetimeByDate(new Date('2023-12-13T19:00:00.000Z')),
        },
      ]);
    };
    // 関数の戻りが正しいかテスト
    const result = getVRChatJoinInfoWithVRChatPhotoList({
      getVRChatPhotoWithWorldIdAndDate,
    })({ year: '2023', month: '12' });
    if (result.isErr()) {
      throw result.error;
    }

    expect(result.value).toEqual([
      {
        joinDatetime: new Date('2023-12-13T18:00:00.000Z'),
        worldId: 'wrld_1234567890',
        imgPath: '2023-12/join3',
        photoList: [
          {
            datetime: new Date('2023-12-13T19:00:00.000Z'),
            path: '2023-12/photo3',
          },
        ],
      },
      {
        joinDatetime: new Date('2023-12-13T14:00:00.000Z'),
        worldId: 'wrld_1234567890',
        imgPath: '2023-12/join2',
        photoList: [
          {
            datetime: new Date('2023-12-13T15:00:00.000Z'),
            path: '2023-12/photo1',
          },
          {
            datetime: new Date('2023-12-13T16:00:00.000Z'),
            path: '2023-12/photo2',
          },
        ],
      },
      {
        joinDatetime: new Date('2023-12-13T12:00:00.000Z'),
        worldId: 'wrld_1234567890',
        imgPath: '2023-12/join1',
        photoList: [],
      },
    ]);
  });
});
