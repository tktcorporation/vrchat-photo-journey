import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Photo } from '../../../types/photo';
import { usePhotoGallery } from '../usePhotoGallery';

// モックデータ
const mockPhotos = [
  {
    id: '1',
    photoPath: '/path/to/VRChat_2024-01-01_01-00-00.000_1920x1080.png',
    photoTakenAt: new Date('2024-01-01T01:00:00Z'),
    width: 1920,
    height: 1080,
  },
  {
    id: '2',
    photoPath: '/path/to/VRChat_2024-01-01_00-00-00.000_1920x1080.png',
    photoTakenAt: new Date('2024-01-01T00:00:00Z'),
    width: 1920,
    height: 1080,
  },
  {
    id: '3',
    photoPath: '/path/to/VRChat_2023-12-31_23-00-00.000_1920x1080.png',
    photoTakenAt: new Date('2023-12-31T23:00:00Z'),
    width: 1920,
    height: 1080,
  },
  {
    id: '4',
    photoPath: '/path/to/VRChat_2023-12-31_22-00-00.000_1920x1080.png',
    photoTakenAt: new Date('2023-12-31T22:00:00Z'),
    width: 1920,
    height: 1080,
  },
];

type MockPhotoType = (typeof mockPhotos)[number];

// モックの設定
const createMockState = () => {
  let isLoading = true;
  let photoData: MockPhotoType[] | undefined = undefined;

  const setState = (loading: boolean, data: typeof photoData) => {
    isLoading = loading;
    photoData = data;
  };

  const getState = () => ({
    data: photoData,
    isLoading,
  });

  return { setState, getState };
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
            joinedAt: p.takenAt,
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
      debug: {
        totalPhotos: photos.length,
        totalGroups: Object.keys(groups).length,
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
    expect(group.photos).toHaveLength(4);
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

  it('Windows形式とUNIX形式のパスを正しく処理する', () => {
    const windowsStylePhotos = [
      {
        id: '1',
        photoPath:
          'C:\\Users\\test\\VRChat\\2024\\01\\VRChat_2024-01-01_00-00-00.000_1920x1080.png',
        photoTakenAt: new Date('2024-01-01T00:00:00Z'),
        width: 1920,
        height: 1080,
      },
    ];

    const unixStylePhotos = [
      {
        id: '2',
        photoPath:
          '/home/test/VRChat/2024/01/VRChat_2024-01-01_00-00-00.000_1920x1080.png',
        photoTakenAt: new Date('2024-01-01T00:00:00Z'),
        width: 1920,
        height: 1080,
      },
    ];

    const { result, rerender } = renderHook(() => usePhotoGallery(''));

    // Windowsスタイルのパスをテスト
    act(() => {
      mockState.setState(false, windowsStylePhotos);
      rerender();
      vi.runAllTimers();
    });

    let group = Object.values(result.current.groupedPhotos)[0];
    expect(group.photos[0].fileNameWithExt.value).toBe(
      'VRChat_2024-01-01_00-00-00.000_1920x1080.png',
    );

    // UNIXスタイルのパスをテスト
    act(() => {
      mockState.setState(false, unixStylePhotos);
      rerender();
      vi.runAllTimers();
    });

    group = Object.values(result.current.groupedPhotos)[0];
    expect(group.photos[0].fileNameWithExt.value).toBe(
      'VRChat_2024-01-01_00-00-00.000_1920x1080.png',
    );
  });
});
