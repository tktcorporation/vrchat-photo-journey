import { WorldId } from '../service/type';
import {
  groupingPhotoListByWorldJoinInfo,
  removeAdjacentDuplicateWorldEntries,
} from './service';

describe('groupingPhotoListByWorldJoinInfo', () => {
  it('should be defined', () => {
    const result = groupingPhotoListByWorldJoinInfo([], []);
    expect(result).toStrictEqual([]);
  });

  it('1対1でグルーピング', () => {
    const result = groupingPhotoListByWorldJoinInfo(
      [
        {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
      ],
      [
        {
          photoPath: 'photoPath',
          tookDatetime: new Date('2020-01-02'),
        },
      ],
    );
    expect(result).toStrictEqual([
      {
        world: {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
        tookPhotoList: [
          {
            photoPath: 'photoPath',
            tookDatetime: new Date('2020-01-02'),
          },
        ],
      },
    ]);
  });

  it('1対2でグルーピング', () => {
    const result = groupingPhotoListByWorldJoinInfo(
      [
        {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
      ],
      [
        {
          photoPath: 'photoPath1',
          tookDatetime: new Date('2020-01-02'),
        },
        {
          photoPath: 'photoPath2',
          tookDatetime: new Date('2020-01-03'),
        },
      ],
    );
    expect(result).toStrictEqual([
      {
        world: {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
        tookPhotoList: [
          {
            photoPath: 'photoPath1',
            tookDatetime: new Date('2020-01-02'),
          },
          {
            photoPath: 'photoPath2',
            tookDatetime: new Date('2020-01-03'),
          },
        ],
      },
    ]);
  });
  it('1:2, 1:2 でグルーピング', () => {
    const result = groupingPhotoListByWorldJoinInfo(
      [
        {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
        {
          worldId: 'wrld_5678',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-03'),
        },
      ],
      [
        {
          photoPath: 'photoPath1',
          tookDatetime: new Date('2020-01-02'),
        },
        {
          photoPath: 'photoPath2',
          tookDatetime: new Date('2020-01-02'),
        },
        {
          photoPath: 'photoPath3',
          tookDatetime: new Date('2020-01-04'),
        },
        {
          photoPath: 'photoPath4',
          tookDatetime: new Date('2020-01-05'),
        },
      ],
    );
    expect(result).toStrictEqual([
      {
        world: {
          worldId: 'wrld_1234',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-01'),
        },
        tookPhotoList: [
          {
            photoPath: 'photoPath1',
            tookDatetime: new Date('2020-01-02'),
          },
          {
            photoPath: 'photoPath2',
            tookDatetime: new Date('2020-01-02'),
          },
        ],
      },
      {
        world: {
          worldId: 'wrld_5678',
          worldName: 'worldName',
          joinDatetime: new Date('2020-01-03'),
        },
        tookPhotoList: [
          {
            photoPath: 'photoPath3',
            tookDatetime: new Date('2020-01-04'),
          },
          {
            photoPath: 'photoPath4',
            tookDatetime: new Date('2020-01-05'),
          },
        ],
      },
    ]);
  });
});

describe('removeAdjacentDuplicateWorldEntries', () => {
  const factoryWorldJoinLogInfo = (
    worldId: string,
    worldName: string,
    joinDatetime: Date,
  ) => ({
    year: joinDatetime.getFullYear().toString(),
    month: joinDatetime.getMonth().toString(),
    day: joinDatetime.getDate().toString(),
    hour: joinDatetime.getHours().toString(),
    minute: joinDatetime.getMinutes().toString(),
    second: joinDatetime.getSeconds().toString(),
    worldId: `wrld_${worldId}` as WorldId,
    worldName,
  });

  it('should be defined', () => {
    const result = removeAdjacentDuplicateWorldEntries([]);
    expect(result).toStrictEqual([]);
  });

  it('そのまま返ってくる', () => {
    const result = removeAdjacentDuplicateWorldEntries([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
    ]);
    expect(result).toStrictEqual([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
    ]);
  });
  it('2つ連続で同じワールドに入った場合、1つめだけが残る', () => {
    const result = removeAdjacentDuplicateWorldEntries([
      factoryWorldJoinLogInfo('2345', 'worldName', new Date('2020-01-04')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-02')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-03')),
    ]);
    expect(result).toStrictEqual([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-03')),
      factoryWorldJoinLogInfo('2345', 'worldName', new Date('2020-01-04')),
    ]);
  });
  it('3つ連続で同じワールドに入った場合、1つめだけが残る', () => {
    const result = removeAdjacentDuplicateWorldEntries([
      factoryWorldJoinLogInfo('2345', 'worldName', new Date('2020-01-04')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-02')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-03')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-05')),
    ]);
    expect(result).toStrictEqual([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('2345', 'worldName', new Date('2020-01-04')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-05')),
    ]);
  });
  it('2連続が別ワールドを挟んで複数回繰り返される場合、それぞれで1つずつ残る', () => {
    const result = removeAdjacentDuplicateWorldEntries([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-02')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-03')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-04')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-05')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-06')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-07')),
    ]);
    expect(result).toStrictEqual([
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-01')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-03')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-04')),
      factoryWorldJoinLogInfo('3456', 'worldName', new Date('2020-01-05')),
      factoryWorldJoinLogInfo('1234', 'worldName', new Date('2020-01-06')),
    ]);
  });
});
