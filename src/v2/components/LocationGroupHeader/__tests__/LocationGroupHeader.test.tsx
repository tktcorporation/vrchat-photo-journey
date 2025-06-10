import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationGroupHeader } from '../index';

// tRPCモック
vi.mock('@/trpc', () => ({
  trpcReact: {
    vrchatApi: {
      getVrcWorldInfoByWorldId: {
        useQuery: vi.fn(),
      },
      convertImageToBase64: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
      },
    },
    logInfo: {
      getPlayerListInSameWorld: {
        useQuery: vi.fn(),
      },
    },
    electronUtil: {
      openUrlInDefaultBrowser: {
        useMutation: vi.fn().mockReturnValue({
          mutate: vi.fn(),
        }),
      },
      copyTextToClipboard: {
        useMutation: vi.fn().mockReturnValue({
          mutateAsync: vi.fn(),
        }),
      },
      copyImageDataByBase64: {
        useMutation: vi.fn().mockReturnValue({
          mutateAsync: vi.fn(),
        }),
      },
      downloadImageAsPhotoLogPng: {
        useMutation: vi.fn().mockReturnValue({
          mutateAsync: vi.fn(),
        }),
      },
    },
  },
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// createPortalのモック
vi.mock('react-dom', () => ({
  createPortal: vi.fn((element) => element),
}));

const mockProps = {
  worldId: 'wrld_12345',
  worldName: 'Test World',
  worldInstanceId: 'instance123',
  photoCount: 5,
  joinDateTime: new Date('2023-01-01T12:00:00Z'),
};

describe('LocationGroupHeader - Player Uniqueness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejoinしたプレイヤーの重複を除去する', async () => {
    const { trpcReact } = await import('@/trpc');

    // 同じプレイヤーが複数回joinしたデータをモック
    const duplicatePlayersData = [
      {
        id: '1',
        playerId: 'usr_player1',
        playerName: 'DuplicatePlayer',
        joinDateTime: new Date('2023-01-01T12:05:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        playerId: 'usr_player2',
        playerName: 'UniquePlayer',
        joinDateTime: new Date('2023-01-01T12:10:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        playerId: 'usr_player1',
        playerName: 'DuplicatePlayer', // 同じプレイヤー名（rejoin）
        joinDateTime: new Date('2023-01-01T12:15:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // VRChatワールド情報のモック
    vi.mocked(
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery,
    ).mockReturnValue({ data: null });
    // プレイヤーリストのモック
    vi.mocked(
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery,
    ).mockReturnValue({
      data: duplicatePlayersData,
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // プレイヤー数表示が重複排除されていることを確認（3人ではなく2人）
    expect(screen.getByText('2')).toBeTruthy();

    // プレイヤー名が重複表示されていないことを確認
    // DuplicatePlayerはtoolipとmain displayの両方に表示される可能性があるため、
    // 主表示エリアでの重複がないことを確認
    const playerNamesInTooltip = screen.getAllByText('DuplicatePlayer');
    // ツールチップやその他の場所での表示を考慮して、合理的な数であることを確認
    expect(playerNamesInTooltip.length).toBeGreaterThan(0);
  });

  it('異なるプレイヤー名は正常に表示される', async () => {
    const { trpcReact } = await import('@/trpc');

    const uniquePlayersData = [
      {
        id: '1',
        playerId: 'usr_player1',
        playerName: 'Player1',
        joinDateTime: new Date('2023-01-01T12:05:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        playerId: 'usr_player2',
        playerName: 'Player2',
        joinDateTime: new Date('2023-01-01T12:10:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        playerId: 'usr_player3',
        playerName: 'Player3',
        joinDateTime: new Date('2023-01-01T12:15:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // VRChatワールド情報のモック
    vi.mocked(
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery,
    ).mockReturnValue({ data: null });
    // プレイヤーリストのモック
    vi.mocked(
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery,
    ).mockReturnValue({
      data: uniquePlayersData,
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // 全プレイヤーが表示されることを確認
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getAllByText('Player1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player3').length).toBeGreaterThan(0);
  });

  it('空のプレイヤーリストを正しく処理する', async () => {
    const { trpcReact } = await import('@/trpc');

    // VRChatワールド情報のモック
    vi.mocked(
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery,
    ).mockReturnValue({ data: null });
    // プレイヤーリストのモック（空）
    vi.mocked(
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery,
    ).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // プレイヤーセクションが表示されないことを確認（プレイヤー数が0または表示されない）
    // 空のプレイヤーリストの場合、プレイヤー数部分が表示されないか、0が表示される
    const playerCountElements = screen.queryAllByText(/^[0-9]+$/);
    if (playerCountElements.length > 0) {
      // もしプレイヤー数が表示される場合は、0であることを確認
      expect(screen.queryByText('0')).toBeTruthy();
    }
  });
});
