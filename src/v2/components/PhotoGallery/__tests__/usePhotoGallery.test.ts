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

// モックの設定
const createMockState = () => {
  let isLoading = true;
  let photoData: typeof mockPhotos | undefined = undefined;

  const setState = (loading: boolean, data: typeof mockPhotos | undefined) => {
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
  useGroupPhotos: (photos: Photo[]) => ({
    groupedPhotos:
      photos.length > 0
        ? {
            'test-group': {
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
              joinDateTime: photos[0].takenAt,
            },
          }
        : {},
    isLoading: false,
    loadMoreGroups: vi.fn(),
    debug: {
      totalGroups: photos.length > 0 ? 1 : 0,
      totalPhotos: photos.length,
      loadedPhotos: photos.length,
      remainingGroups: 0,
    },
  }),
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
});
