import type { Photo } from '../../types/photo';
// import { describe, it, expect } from 'vitest';
import { groupPhotosBySession } from './useGroupPhotos';

interface MockWorldJoinLog {
  id: string;
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
}

// モックデータの作成ヘルパー
const createMockPhoto = (id: string, takenAt: Date): Photo => ({
  id,
  url: `photo-${id}`,
  takenAt,
  width: 1920,
  height: 1080,
  location: {
    name: '',
    description: '',
    coverImage: '',
    visitedWith: [],
    joinedAt: takenAt,
  },
});

const createMockWorldJoinLog = (
  worldId: string,
  joinDateTime: Date,
): MockWorldJoinLog => ({
  id: `log-${worldId}`,
  worldId,
  worldName: `World ${worldId}`,
  worldInstanceId: `instance-${worldId}`,
  joinDateTime,
});

describe('groupPhotosBySession', () => {
  it('新しい写真から順にグループ化される', () => {
    const now = new Date();
    const photos = [
      createMockPhoto('1', new Date(now.getTime() - 1000)), // 1秒前
      createMockPhoto('2', new Date(now.getTime() - 2000)), // 2秒前
      createMockPhoto('3', new Date(now.getTime() - 3000)), // 3秒前
    ];

    const joinLogs = [
      createMockWorldJoinLog('world1', new Date(now.getTime() - 2500)), // 2.5秒前
      createMockWorldJoinLog('world2', new Date(now.getTime() - 4000)), // 4秒前
    ];

    const groups = groupPhotosBySession(photos, joinLogs);

    expect(groups).toHaveLength(2); // 2つのワールドグループができているはず

    // 最初のグループ（新しい方）の検証
    expect(groups[0].worldId).toBe('world1');
    expect(groups[0].photos).toHaveLength(2); // photo1とphoto2
    expect(groups[0].photos[0].id).toBe('1'); // 最新の写真が最初
    expect(groups[0].photos[1].id).toBe('2');

    // 2番目のグループの検証
    expect(groups[1].worldId).toBe('world2');
    expect(groups[1].photos).toHaveLength(1); // photo3
    expect(groups[1].photos[0].id).toBe('3');
  });

  it('写真がない場合は空の配列を返す', () => {
    const groups = groupPhotosBySession([], []);
    expect(groups).toHaveLength(0);
  });

  it('同じワールドの複数セッションを正しく処理', () => {
    const now = new Date();
    const photos = [
      createMockPhoto('1', new Date(now.getTime() - 1000)),
      createMockPhoto('2', new Date(now.getTime() - 3000)),
      createMockPhoto('3', new Date(now.getTime() - 5000)),
    ];

    const joinLogs = [
      createMockWorldJoinLog('world1', new Date(now.getTime() - 2000)),
      createMockWorldJoinLog('world1', new Date(now.getTime() - 4000)), // 同じワールドの2回目のセッション
    ];

    const groups = groupPhotosBySession(photos, joinLogs);

    expect(groups).toHaveLength(2); // 同じワールドでも別セッションとして2つのグループができる
    expect(groups[0].photos).toHaveLength(1); // 最新のセッション
    expect(groups[1].photos).toHaveLength(2); // 古いセッション
  });

  it('写真とセッションの時間が完全に一致する場合', () => {
    const now = new Date();
    const photos = [createMockPhoto('1', new Date(now.getTime()))];

    const joinLogs = [
      createMockWorldJoinLog('world1', new Date(now.getTime())),
    ];

    const groups = groupPhotosBySession(photos, joinLogs);

    expect(groups).toHaveLength(1);
    expect(groups[0].photos).toHaveLength(1);
    expect(groups[0].photos[0].id).toBe('1');
  });
});
