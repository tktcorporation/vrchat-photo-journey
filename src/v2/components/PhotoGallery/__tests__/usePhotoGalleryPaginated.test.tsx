import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePhotoGalleryPaginated } from '../usePhotoGalleryPaginated';

// tRPCのモック
vi.mock('@/trpc', () => ({
  trpcReact: {
    vrchatPhoto: {
      getVrchatPhotoPathModelListPaginated: {
        useInfiniteQuery: vi.fn(() => ({
          data: {
            pages: [
              {
                photos: [
                  {
                    id: '1',
                    photoPath: '/test/VRChat_1920x1080_2024-01-01_12-00-00.000.png',
                    photoTakenAt: new Date('2024-01-01T12:00:00.000Z'),
                    width: 1920,
                    height: 1080,
                  },
                ],
                totalCount: 1,
                currentPage: 0,
                totalPages: 1,
              },
            ],
          },
          isLoading: false,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
    },
    logInfo: {
      searchSessionsByPlayerName: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
    vrchatWorldJoinLog: {
      getVRChatWorldJoinLogList: {
        useQuery: vi.fn(() => ({
          data: [
            {
              worldId: 'wrld_test',
              worldName: 'Test World',
              worldInstanceId: 'test-instance',
              joinDateTime: new Date('2024-01-01T12:00:00.000Z'),
            },
          ],
          isLoading: false,
        })),
      },
    },
  },
}));

// ValueObjectのモック
vi.mock('../../../../valueObjects', () => ({
  VRChatPhotoFileNameWithExtSchema: {
    parse: vi.fn((value) => ({ value })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePhotoGalleryPaginated', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(
      () => usePhotoGalleryPaginated('', undefined, { enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedPhoto).toBe(null);
    expect(result.current.selectedPhotos).toEqual(new Set());
    expect(result.current.isMultiSelectMode).toBe(false);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
  });

  it('should handle search query filtering', async () => {
    const { result } = renderHook(
      () => usePhotoGalleryPaginated('Test World', 'world'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.debug.totalPhotosFromHook).toBe(1);
    });
  });

  it('should provide pagination info in debug', async () => {
    const { result } = renderHook(
      () => usePhotoGalleryPaginated(''),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.debug.paginationInfo).toBeDefined();
      expect(result.current.debug.paginationInfo?.totalCount).toBe(1);
      expect(result.current.debug.paginationInfo?.loadedPages).toBe(1);
    });
  });

  it('should handle photo selection', () => {
    const { result } = renderHook(
      () => usePhotoGalleryPaginated(''),
      { wrapper: createWrapper() },
    );

    const testPhoto = {
      id: 'test-photo',
      url: '/test/photo.png',
      fileNameWithExt: { value: 'photo.png' },
      takenAt: new Date(),
      width: 1920,
      height: 1080,
      location: { joinedAt: new Date() },
    };

    // Single selection
    result.current.setSelectedPhoto(testPhoto);
    expect(result.current.selectedPhoto).toBe(testPhoto);

    // Multi selection
    result.current.setIsMultiSelectMode(true);
    expect(result.current.isMultiSelectMode).toBe(true);

    result.current.setSelectedPhotos(new Set(['test-photo']));
    expect(result.current.selectedPhotos).toEqual(new Set(['test-photo']));
  });
});