import { Resvg } from '@resvg/resvg-js';
import type React from 'react';
import satori from 'satori';
import { match } from 'ts-pattern';
import { extractDominantColorsFromBase64 } from './colorExtractor';

interface GeneratePreviewParams {
  worldName: string;
  imageBase64: string;
  players: { playerName: string }[] | null;
  showAllPlayers: boolean;
}

/**
 * Satoriで使用するフォントデータを取得
 */
async function getFontData(): Promise<ArrayBuffer> {
  // Inter フォントを取得
  const response = await fetch(
    'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2',
  );
  return response.arrayBuffer();
}

/**
 * プレイヤーリストのReactコンポーネント
 */
const PlayerList: React.FC<{
  players: { playerName: string }[];
  showAllPlayers: boolean;
}> = ({ players, showAllPlayers }) => {
  if (!players || players.length === 0) return null;

  const maxLineWidth = 740;
  const playerPadding = 20;
  const playerGap = 6;
  const lineHeight = 30;

  // プレイヤー名の幅を計算
  const calculateTextWidth = (text: string) => {
    return [...text].reduce((width, char) => {
      return width + (/[\u3000-\u9fff]/.test(char) ? 14 : 7);
    }, 0);
  };

  // プレイヤーの表示レイアウトを計算
  const calculateLayout = () => {
    const lines: { playerName: string }[][] = [[]];
    let currentLineWidth = 0;
    let currentLineIndex = 0;

    const { displayPlayers, remainingCount } = match(showAllPlayers)
      .with(true, () => ({
        displayPlayers: players,
        remainingCount: 0,
      }))
      .with(false, () => {
        const moreFixedWidth = 100;
        const availableWidth = maxLineWidth - moreFixedWidth;
        const tempPlayers: typeof players = [];
        let accumulatedWidth = 0;
        let isSecondRow = false;

        for (const player of players) {
          const playerWidth =
            calculateTextWidth(player.playerName) + playerPadding;
          const effectiveWidth = isSecondRow ? availableWidth : maxLineWidth;

          if (accumulatedWidth + playerWidth <= effectiveWidth) {
            tempPlayers.push(player);
            accumulatedWidth += playerWidth + playerGap;
          } else if (!isSecondRow) {
            isSecondRow = true;
            accumulatedWidth = playerWidth + playerGap;
            tempPlayers.push(player);
          } else {
            break;
          }
        }

        return {
          displayPlayers: tempPlayers,
          remainingCount: players.length - tempPlayers.length,
        };
      })
      .exhaustive();

    // レイアウト計算
    for (const player of displayPlayers) {
      const playerWidth = calculateTextWidth(player.playerName) + playerPadding;

      if (
        currentLineWidth + playerWidth > maxLineWidth &&
        lines[currentLineIndex].length > 0
      ) {
        currentLineIndex++;
        lines[currentLineIndex] = [];
        currentLineWidth = 0;
      }

      lines[currentLineIndex].push(player);
      currentLineWidth += playerWidth + playerGap;
    }

    return { lines, remainingCount };
  };

  const { lines, remainingCount } = calculateLayout();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.6)',
          letterSpacing: '0.05em',
        }}
      >
        PLAYERS ({players.length})
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${lineHeight - 24}px`,
          marginTop: '22px',
        }}
      >
        {lines.map((line, lineIndex) => (
          <div
            key={`line-${line.map((p) => p.playerName).join('-')}-${lineIndex}`}
            style={{
              display: 'flex',
              gap: `${playerGap}px`,
            }}
          >
            {line.map((player) => (
              <div
                key={player.playerName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {player.playerName}
              </div>
            ))}
            {lineIndex === lines.length - 1 &&
              !showAllPlayers &&
              remainingCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  +{remainingCount} more
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * プレビュー画像のReactコンポーネント
 */
const PreviewComponent: React.FC<{
  worldName: string;
  imageBase64: string;
  players: { playerName: string }[] | null;
  showAllPlayers: boolean;
  colors: { primary: string; secondary: string; accent: string };
  totalHeight: number;
}> = ({
  worldName,
  imageBase64,
  players,
  showAllPlayers,
  colors,
  totalHeight,
}) => {
  const imageWidth = 736;
  const imageHeight = 414;
  const imageX = Math.round((800 - imageWidth) / 2);
  const imageY = 70;

  return (
    <div
      style={{
        width: 800,
        height: totalHeight,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#7FB5B5',
      }}
    >
      {/* 背景のぼかし画像 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(data:image/png;base64,${imageBase64})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) saturate(1.2)',
          opacity: 0.8,
        }}
      />

      {/* グラデーションオーバーレイ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, ${colors.primary}66, ${colors.secondary}66)`,
        }}
      />

      {/* コンテンツ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 32px',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {worldName}
          </div>
          <div
            style={{
              width: '200px',
              height: '3px',
              backgroundColor: colors.accent,
              borderRadius: '1.5px',
            }}
          />
        </div>

        {/* メイン画像 */}
        <div
          style={{
            position: 'absolute',
            left: imageX,
            top: imageY,
            width: imageWidth,
            height: imageHeight,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt={worldName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* プレイヤーリスト */}
        <div
          style={{
            marginTop: `${500 - 24}px`,
          }}
        >
          <PlayerList players={players || []} showAllPlayers={showAllPlayers} />
        </div>
      </div>
    </div>
  );
};

/**
 * Satoriを使用してプレビューSVGを生成
 */
async function generatePreviewSvg({
  worldName,
  imageBase64,
  players,
  showAllPlayers,
}: GeneratePreviewParams): Promise<{ svg: string; height: number }> {
  const colors = await extractDominantColorsFromBase64(imageBase64);

  // プレイヤーリストの高さを計算
  const playerCount = players?.length || 0;
  const linesNeeded = showAllPlayers
    ? Math.ceil(playerCount / 15)
    : Math.min(2, Math.ceil(playerCount / 15));
  const playerListHeight = playerCount > 0 ? 22 + linesNeeded * 30 : 0;

  const totalHeight = match(showAllPlayers)
    .with(true, () => Math.max(600, 500 + playerListHeight + 24))
    .with(false, () => 600)
    .exhaustive();

  const fontData = await getFontData();

  const svg = await satori(
    <PreviewComponent
      worldName={worldName}
      imageBase64={imageBase64}
      players={players}
      showAllPlayers={showAllPlayers}
      colors={colors}
      totalHeight={totalHeight}
    />,
    {
      width: 800,
      height: totalHeight,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fontData,
          weight: 500,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fontData,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  return { svg, height: totalHeight };
}

/**
 * 生成したSVGをPNG形式のBase64文字列へ変換
 */
export async function generatePreviewPng(
  params: GeneratePreviewParams,
): Promise<string> {
  const { svg } = await generatePreviewSvg(params);

  // ResvgでSVGをPNGに変換
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 800 * 2, // 2倍のサイズで描画
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // ArrayBufferをBase64に変換
  const base64 = btoa(
    new Uint8Array(pngBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      '',
    ),
  );

  return base64;
}
