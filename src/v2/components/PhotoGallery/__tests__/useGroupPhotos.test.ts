import type { Photo } from '../../../types/photo';
import { groupPhotosBySession } from '../useGroupPhotos';
import type { WorldJoinLog } from '../useGroupPhotos';

describe('groupPhotosBySession', () => {
  const createPhoto = (id: number, takenAt: Date): Photo => ({
    id: id.toString(),
    url: `photo${id}.png`,
    fileName: `photo${id}.png`,
    width: 1920,
    height: 1080,
    takenAt,
    location: {
      name: '',
      description: '',
      coverImage: '',
      visitedWith: [],
      joinedAt: takenAt,
    },
  });

  const createWorldJoinLog = (
    id: number,
    joinDateTime: Date,
    worldName = `World${id}`,
  ): WorldJoinLog => ({
    worldId: `world${id}`,
    worldName,
    worldInstanceId: `instance${id}`,
    joinDateTime,
  });

  it('should group photos by session correctly', () => {
    const baseTime = new Date('2024-01-01T12:00:00Z').getTime();

    // セッション1: 12:10:00 - 12:20:00
    const session1Start = new Date(baseTime + 10 * 60 * 1000); // 12:10:00
    const session1Photos = [
      createPhoto(1, new Date(baseTime + 15 * 60 * 1000)), // 12:15:00
      createPhoto(2, new Date(baseTime + 18 * 60 * 1000)), // 12:18:00
    ];

    // セッション2: 12:00:00 - 12:10:00
    const session2Start = new Date(baseTime); // 12:00:00
    const session2Photos = [
      createPhoto(3, new Date(baseTime + 5 * 60 * 1000)), // 12:05:00
      createPhoto(4, new Date(baseTime + 8 * 60 * 1000)), // 12:08:00
    ];

    const photos = [...session1Photos, ...session2Photos];
    const joinLogs = [
      createWorldJoinLog(1, session1Start, 'World1'),
      createWorldJoinLog(2, session2Start, 'World2'),
    ];

    // デバッグ情報を出力
    console.log('Test data:', {
      photos: photos.map((p) => ({
        id: p.id,
        time: new Date(p.takenAt).toISOString(),
      })),
      sessions: joinLogs.map((s) => ({
        id: s.worldId,
        name: s.worldName,
        time: new Date(s.joinDateTime).toISOString(),
      })),
    });

    const groups = groupPhotosBySession(photos, joinLogs);

    // グループの詳細情報を出力
    console.log(
      'Resulting groups:',
      groups.map((g) => ({
        worldName: g.worldInfo?.worldName,
        joinTime: new Date(g.joinDateTime).toISOString(),
        photoCount: g.photos.length,
        photoIds: g.photos.map((p) => p.id),
        photoTimes: g.photos.map((p) => new Date(p.takenAt).toISOString()),
      })),
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].photos).toHaveLength(2); // 最新のセッションに2枚
    expect(groups[1].photos).toHaveLength(2); // 古いセッションに2枚

    // 写真が正しいグループに割り当てられているか確認
    expect(groups[0].photos.map((p) => p.id).sort()).toEqual(['1', '2']);
    expect(groups[1].photos.map((p) => p.id).sort()).toEqual(['3', '4']);

    // 各グループの時間範囲を確認
    expect(groups[0].joinDateTime).toEqual(session1Start);
    expect(groups[1].joinDateTime).toEqual(session2Start);
  });

  it('should handle photos without matching sessions', () => {
    const now = new Date();
    const photos = [
      createPhoto(1, new Date(now.getTime() - 5000)), // セッションより古い写真
    ];

    const joinLogs = [
      createWorldJoinLog(1, now), // 最新のセッション
    ];

    const groups = groupPhotosBySession(photos, joinLogs);

    expect(groups).toHaveLength(1);
    expect(groups[0].photos).toHaveLength(1);
    expect(groups[0].photos[0].id).toBe('1');
  });

  it('should handle large number of photos correctly', () => {
    const now = new Date();
    const photos = Array.from({ length: 100 }, (_, i) =>
      createPhoto(i, new Date(now.getTime() - i * 1000)),
    );

    const joinLogs = Array.from({ length: 10 }, (_, i) =>
      createWorldJoinLog(i, new Date(now.getTime() - i * 10000)),
    );

    const groups = groupPhotosBySession(photos, joinLogs);

    const totalPhotos = groups.reduce(
      (sum, group) => sum + group.photos.length,
      0,
    );
    expect(totalPhotos).toBe(photos.length);

    // 各グループの写真数をログ出力
    groups.forEach((group, i) => {
      console.log(`Group ${i} (${group.worldInfo?.worldName}):`, {
        photoCount: group.photos.length,
        firstPhotoId: group.photos[0]?.id,
        lastPhotoId: group.photos[group.photos.length - 1]?.id,
      });
    });
  });
});
