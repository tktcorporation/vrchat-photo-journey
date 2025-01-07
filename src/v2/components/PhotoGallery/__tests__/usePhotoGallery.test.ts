import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Photo } from '../../../types/photo';
import { usePhotoGallery } from '../usePhotoGallery';

// モックデータ
const mockPhotos = [
  {
    id: '1',
    photoPath: '/path/to/photo1.jpg',
    photoTakenAt: new Date('2024-01-01T01:00:00Z'),
    width: 1920,
    height: 1080,
  },
  {
    id: '2',
    photoPath: '/path/to/photo2.jpg',
    photoTakenAt: new Date('2024-01-01T00:00:00Z'),
    width: 1920,
    height: 1080,
  },
] as const;

const mockPhotosNextBatch = [
  {
    id: '3',
    photoPath: '/path/to/photo3.jpg',
    photoTakenAt: new Date('2023-12-31T23:00:00Z'),
    width: 1920,
    height: 1080,
  },
  {
    id: '4',
    photoPath: '/path/to/photo4.jpg',
    photoTakenAt: new Date('2023-12-31T22:00:00Z'),
    width: 1920,
    height: 1080,
  },
] as const;

// モックの設定
const createMockState = () => {
  let isLoading = true;
  let photoData: typeof mockPhotos | typeof mockPhotosNextBatch | undefined =
    undefined;
  let currentBatch = 0;

  const setState = (loading: boolean, data: typeof photoData) => {
    isLoading = loading;
    photoData = data;
  };

  const getState = () => ({
    data: photoData,
    isLoading,
  });

  const loadNextBatch = () => {
    currentBatch++;
    if (currentBatch === 1) {
      setState(false, mockPhotosNextBatch);
    }
  };

  return { setState, getState, loadNextBatch };
};

const mockState = createMockState();

// useGroupPhotosのモック
vi.mock('../useGroupPhotos', () => ({
  useGroupPhotos: (photos: Photo[]) => {
    const groups: Record<
      string,
      {
        photos: Photo[];
        worldInfo: { worldName: string };
        joinDateTime: Date;
      }
    > = {};

    // 最新の写真でグループを作成
    if (photos.length > 0) {
      const latestPhoto = photos[0];
      const key = latestPhoto.takenAt.toISOString().split('T')[0];
      groups[key] = {
        photos: photos.map((p) => ({
          ...p,
          location: {
            ...p.location,
            name: '',
            description: '',
          },
        })),
        worldInfo: {
          worldName: 'Test World',
        },
        joinDateTime: latestPhoto.takenAt,
      };
    }

    return {
      groupedPhotos: groups,
      isLoading: false,
      loadMoreGroups: vi.fn(),
      debug: {
        totalGroups: Object.keys(groups).length,
        totalPhotos: photos.length,
        loadedPhotos: photos.length,
        remainingGroups: photos.length > 0 ? 1 : 0,
      },
    };
  },
}));

vi.mock('./../../../../trpc', () => ({
  trpcReact: {
    vrchatPhoto: {
      getVrchatPhotoPathModelList: {
        useQuery: () => mockState.getState(),
      },
      getVRChatPhotoItemData: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
        }),
      },
    },
    vrchatWorldJoinLog: {
      getVRChatWorldJoinLogList: {
        useQuery: () => ({
          data: [],
          isLoading: false,
        }),
      },
    },
  },
}));

describe('usePhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockState.setState(true, undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態で写真を正しく読み込む', () => {
    const { result, rerender } = renderHook(() => usePhotoGallery(''));

    // 初期状態の確認
    expect(result.current.isLoading).toBe(true);
    expect(Object.keys(result.current.groupedPhotos)).toHaveLength(0);

    // データ読み込み完了をシミュレート
    act(() => {
      mockState.setState(false, mockPhotos);
      rerender();
      vi.runAllTimers();
    });

    // 読み込み完了後の状態を確認
    expect(result.current.isLoading).toBe(false);
    expect(Object.keys(result.current.groupedPhotos)).toHaveLength(1);

    const group = Object.values(result.current.groupedPhotos)[0];
    expect(group.photos).toHaveLength(2);
    expect(group.worldInfo?.worldName).toBe('Test World');
  });

  it('検索クエリでグループをフィルタリングする', () => {
    const { result, rerender } = renderHook(
      (props: { searchQuery: string }) => usePhotoGallery(props.searchQuery),
      {
        initialProps: { searchQuery: '' },
      },
    );

    // データ読み込み完了をシミュレート
    act(() => {
      mockState.setState(false, mockPhotos);
      rerender({ searchQuery: '' });
      vi.runAllTimers();
    });

    const initialGroupCount = Object.keys(result.current.groupedPhotos).length;
    expect(initialGroupCount).toBe(1);

    rerender({ searchQuery: 'nonexistent' });
    expect(Object.keys(result.current.groupedPhotos).length).toBe(0);

    rerender({ searchQuery: '' });
    expect(Object.keys(result.current.groupedPhotos).length).toBe(
      initialGroupCount,
    );
  });

  it('追加の写真を正しく読み込んでグループ化する', () => {
    const { result, rerender } = renderHook(() => usePhotoGallery(''));

    // 初期データを読み込む
    act(() => {
      mockState.setState(false, mockPhotos);
      rerender();
      vi.runAllTimers();
    });

    // 初期状態の確認
    expect(result.current.isLoading).toBe(false);
    expect(Object.keys(result.current.groupedPhotos)).toHaveLength(1);
    expect(result.current.debug.totalPhotos).toBe(2);

    // 追加データの読み込みをトリガー
    act(() => {
      result.current.loadMoreGroups();
      vi.runAllTimers();
    });

    // 次のバッチのデータを提供
    act(() => {
      mockState.loadNextBatch();
      rerender();
      vi.runAllTimers();
    });

    // 追加データが正しく読み込まれたことを確認
    expect(result.current.isLoading).toBe(false);
    expect(Object.keys(result.current.groupedPhotos)).toHaveLength(2);
    expect(result.current.debug.totalPhotos).toBe(4);

    // グループの内容を確認
    const groups = Object.values(result.current.groupedPhotos);
    expect(groups[0].photos).toHaveLength(2); // 最初のグループ
    expect(groups[1].photos).toHaveLength(2); // 追加されたグループ

    // 写真のIDを確認
    const allPhotoIds = groups.flatMap((g) => g.photos.map((p) => p.id));
    expect(allPhotoIds).toContain('1');
    expect(allPhotoIds).toContain('2');
    expect(allPhotoIds).toContain('3');
    expect(allPhotoIds).toContain('4');
  });
});
