import { removeAdjacentDuplicateWorldEntries } from './service';
import type { WorldId } from './type';

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
