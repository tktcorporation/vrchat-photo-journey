import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LocationGroupHeader } from '../index';

// tRPCモック
vi.mock('@/trpc', () => ({
  trpcReact: {
    vrchatApi: {
      getVrcWorldInfoByWorldId: {
        useQuery: vi.fn().mockReturnValue({ data: null }),
      },
    },
    logInfo: {
      getPlayerListInSameWorld: {
        useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
      },
    },
  },
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
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
  it('rejoinしたプレイヤーの重複を除去する', () => {
    const { trpcReact } = require('@/trpc');

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

    trpcReact.logInfo.getPlayerListInSameWorld.useQuery.mockReturnValue({
      data: duplicatePlayersData,
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // プレイヤー数表示が重複排除されていることを確認（3人ではなく2人）
    expect(screen.getByText('2')).toBeTruthy();

    // プレイヤー名が重複表示されていないことを確認
    const duplicatePlayerElements = screen.getAllByText('DuplicatePlayer');
    expect(duplicatePlayerElements).toHaveLength(1); // 1回だけ表示されるべき
  });

  it('異なるプレイヤー名は正常に表示される', () => {
    const { trpcReact } = require('@/trpc');

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

    trpcReact.logInfo.getPlayerListInSameWorld.useQuery.mockReturnValue({
      data: uniquePlayersData,
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // 全プレイヤーが表示されることを確認
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Player1')).toBeTruthy();
    expect(screen.getByText('Player2')).toBeTruthy();
    expect(screen.getByText('Player3')).toBeTruthy();
  });

  it('空のプレイヤーリストを正しく処理する', () => {
    const { trpcReact } = require('@/trpc');

    trpcReact.logInfo.getPlayerListInSameWorld.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<LocationGroupHeader {...mockProps} />);

    // プレイヤーセクションが表示されないことを確認
    expect(screen.queryByText(/\d+/)).toBeNull();
  });
});
