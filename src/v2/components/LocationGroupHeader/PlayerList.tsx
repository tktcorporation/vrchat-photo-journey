import React, { memo } from 'react';

export interface Player {
  id: string;
  playerId: string | null;
  playerName: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayerListProps {
  players: Player[];
  maxVisiblePlayers: number;
}

/**
 * プレイヤーリストを表示するコンポーネント
 * 指定された最大表示数までプレイヤー名を表示し、それ以上は省略表示
 */
export const PlayerList = memo(
  ({ players, maxVisiblePlayers }: PlayerListProps) => {
    const visiblePlayers = players.slice(
      0,
      players.length <= maxVisiblePlayers ? players.length : maxVisiblePlayers,
    );
    const remainingCount = players.length - maxVisiblePlayers;
    const showMoreCount = players.length > maxVisiblePlayers;

    return (
      <>
        {visiblePlayers.map((p: Player, index) => (
          <React.Fragment key={p.id}>
            <span className="opacity-90">{p.playerName}</span>
            {index < visiblePlayers.length - 1 && (
              <span className="opacity-50">/</span>
            )}
          </React.Fragment>
        ))}
        {showMoreCount && (
          <>
            <span className="opacity-50">/</span>
            <span className="opacity-75">+{remainingCount}</span>
          </>
        )}
      </>
    );
  },
);

PlayerList.displayName = 'PlayerList';
