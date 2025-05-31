import satori from 'satori';
import type { ReactNode } from 'react';

interface GeneratePreviewParams {
  worldName: string;
  imageBase64: string;
  players: { playerName: string }[] | null;
  showAllPlayers: boolean;
  fontData: ArrayBuffer;
}

interface ColorBucket {
  r: number;
  g: number;
  b: number;
  count: number;
  hsl: [number, number, number];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;
  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case normalizedR: h = (normalizedG - normalizedB) / d + (normalizedG < normalizedB ? 6 : 0); break;
      case normalizedG: h = (normalizedB - normalizedR) / d + 2; break;
      case normalizedB: h = (normalizedR - normalizedG) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

async function extractDominantColors(imageBase64: string): Promise<{ primary: string; secondary: string; accent: string; }> {
  const img = new Image();
  img.src = imageBase64; // Assumes full data URL
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const colorBuckets: { [key: string]: ColorBucket } = {};
  for (let i = 0; i < data.length; i += 20) {
    const r = Math.floor(data[i] / 5) * 5;
    const g = Math.floor(data[i + 1] / 5) * 5;
    const b = Math.floor(data[i + 2] / 5) * 5;
    const alpha = data[i + 3] / 255;
    if (alpha < 0.5) continue;
    const hsl = rgbToHsl(r, g, b);
    const [, s, l] = hsl;
    if (s < 20 || l < 15 || l > 85) continue;
    const key = `${r},${g},${b}`;
    if (colorBuckets[key]) colorBuckets[key].count++;
    else colorBuckets[key] = { r, g, b, count: 1, hsl };
  }
  const sortedColors = Object.values(colorBuckets).sort((a, b) => b.count - a.count).filter(b => b.count > 20);
  const defaultColors = { primary: { r: 59, g: 130, b: 246 }, secondary: { r: 147, g: 51, b: 234 }, accent: { r: 79, g: 70, b: 229 }};
  if (sortedColors.length === 0) {
    return { primary: `rgb(${defaultColors.primary.r}, ${defaultColors.primary.g}, ${defaultColors.primary.b})`, secondary: `rgb(${defaultColors.secondary.r}, ${defaultColors.secondary.g}, ${defaultColors.secondary.b})`, accent: `rgb(${defaultColors.accent.r}, ${defaultColors.accent.g}, ${defaultColors.accent.b})` };
  }
  const hueGroups: { [key: number]: ColorBucket[] } = {};
  for (const color of sortedColors) {
    const hueGroup = Math.floor(color.hsl[0] / 30);
    if (!hueGroups[hueGroup]) hueGroups[hueGroup] = [];
    hueGroups[hueGroup].push(color);
  }
  const hueGroupsArray = Object.values(hueGroups).sort((a,b) => b[0].count - a[0].count);
  const primary = hueGroupsArray[0]?.[0] || sortedColors[0];
  const secondary = hueGroupsArray[1]?.[0] || sortedColors[Math.floor(sortedColors.length / 3)];
  const accent = hueGroupsArray[2]?.[0] || sortedColors[Math.floor(sortedColors.length / 2)];
  return { primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`, secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`, accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})` };
}

// Renamed and refactored to generate HTML-like JSX for Satori
// Renamed and refactored to generate HTML-like JSX for Satori
function generatePlayerElementsHtmlJsx(
  players: { playerName: string }[] | null,
  showAllPlayers: boolean,
  subHeaderFontSize: string,
  imageYOffset: number, // Added
  imageHeightBase: number, // Added
): { elements: ReactNode; height: number } {
  if (!players || players.length === 0) return { elements: null, height: 0 };

  const playerElementsList: ReactNode[] = [];

  playerElementsList.push(
    <div
      key="players-header-title"
      style={{
        fontSize: subHeaderFontSize,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: '0.05em',
        fontFamily: 'Noto Sans CJK JP',
        marginBottom: 8,
      }}
    >
      {`PLAYERS (${players.length})`}
    </div>
  );

  const playerBadgesContainer: ReactNode[] = [];
  const maxLineWidth = 740;

  const playerWidths = players.map((player) => {
    const nameWidth = [...player.playerName].reduce((width, char) => {
      return width + (/[\u3000-\u9fff]/.test(char) ? 14 : 7);
    }, 0);
    return nameWidth + 20;
  });

  let displayPlayers: typeof players;
  let remainingCount = 0;

  if (!showAllPlayers) {
    const moreFixedWidth = 80;
    let currentLinePlayers: typeof players = [];
    let currentLineWidth = 0;
    let lines = 0;
    const maxLines = 2;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const playerWidth = playerWidths[i];

      if (lines < maxLines) {
        if (currentLineWidth + playerWidth < maxLineWidth) {
          currentLinePlayers.push(player);
          currentLineWidth += playerWidth + 6;
        } else {
          lines++;
          if (lines < maxLines) {
            currentLinePlayers.push(player);
            currentLineWidth = playerWidth + 6;
          } else {
            remainingCount = players.length - currentLinePlayers.length;
            break;
          }
        }
      } else {
         remainingCount = players.length - currentLinePlayers.length;
         break;
      }
    }
    if (lines >= maxLines && currentLinePlayers.length < players.length && remainingCount === 0) {
        remainingCount = players.length - currentLinePlayers.length;
    }

    if (remainingCount > 0 && lines >= (maxLines -1) ) {
        while(currentLineWidth + moreFixedWidth > maxLineWidth && currentLinePlayers.length > 0) {
            const removedPlayer = currentLinePlayers.pop();
            if(removedPlayer) {
                 currentLineWidth -= playerWidths[players.indexOf(removedPlayer)] + 6;
                 remainingCount++;
            } else {
                break;
            }
        }
    }
    displayPlayers = currentLinePlayers;
  } else {
    displayPlayers = players;
  }

  displayPlayers.forEach((player, index) => {
    playerBadgesContainer.push(
      <div
        key={`player-${player.playerName}-${index}`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
          padding: '4px 10px',
          marginRight: 6,
          marginBottom: 6,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Noto Sans CJK JP',
            whiteSpace: 'nowrap',
          }}
        >
          {player.playerName}
        </div>
      </div>
    );
  });

  if (remainingCount > 0) {
    const moreText = `+${remainingCount} more`;
    playerBadgesContainer.push(
      <div
        key="more-players"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
          padding: '4px 10px',
          marginRight: 6,
          marginBottom: 6,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: 'Noto Sans CJK JP',
            whiteSpace: 'nowrap',
          }}
        >
          {moreText}
        </div>
      </div>
    );
  }

  playerElementsList.push(
    <div key="players-list-flex-container" style={{ display: 'flex', flexWrap: 'wrap', width: maxLineWidth }}>
      {playerBadgesContainer}
    </div>
  );

  let numRows = 0;
  if (displayPlayers.length > 0) {
    let currentLineWidthEst = 0;
    numRows = 1;
    for(let i=0; i<displayPlayers.length; ++i) {
        const playerWidthEst = playerWidths[players.indexOf(displayPlayers[i])] + 6;
        if(currentLineWidthEst + playerWidthEst > maxLineWidth) {
            numRows++;
            currentLineWidthEst = playerWidthEst;
        } else {
            currentLineWidthEst += playerWidthEst;
        }
    }
    if(remainingCount > 0) {
        const moreFixedWidthEst = 80 + 6;
         if(currentLineWidthEst + moreFixedWidthEst > maxLineWidth && numRows < 2) {
            numRows++;
        }
    }
  }
  const playerListContentHeight = numRows * (24 + 6);
  const calculatedHeight = (parseInt(subHeaderFontSize, 10) + 8) + playerListContentHeight;

  return {
    elements: (
      <div style={{
        position: 'absolute',
        left: 32,
        top: imageYOffset + imageHeightBase + 20,
        display: 'flex', // Added: Satori requires display:flex for parent of multiple children
        flexDirection: 'column' // Added: Common default for such containers
      }}>
        {playerElementsList}
      </div>
    ),
    height: calculatedHeight > 0 ? calculatedHeight : 0,
  };
}

export async function generatePreviewSvg({
  worldName,
  imageBase64,
  players,
  showAllPlayers,
  fontData,
}: GeneratePreviewParams): Promise<{ svg: string; height: number }> {
  const headerFontSize = '20px';
  const subHeaderFontSize = '14px'; // as string for style

  const colors = await extractDominantColors(imageBase64); // imageBase64 must be full data URL

  const rawImageBase64 = imageBase64.startsWith('data:image')
    ? imageBase64.split(',')[1]
    : imageBase64;

  // Define image dimensions before they are needed by generatePlayerElementsHtmlJsx or height calculations
  const imageWidth = 736;
  const imageHeightConst = 414; // Keep consistent naming for image dimensions
  const imageX = Math.round((800 - imageWidth) / 2);
  const imageY = 70;

  const { elements: playerElementsHtml, height: playerListHeightCalculated } =
    generatePlayerElementsHtmlJsx(players, showAllPlayers, subHeaderFontSize, imageY, imageHeightConst);

  const baseContentHeight = imageHeightConst + 70 + 20; // Use imageHeightConst, imageY is effectively 70
  const totalHeight = showAllPlayers
    ? Math.max(600, baseContentHeight + playerListHeightCalculated + 24) // 24 for bottom padding
    : 600;

  // imageWidth, imageHeightConst, imageX, imageY already defined above

  const jsx = (
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
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(data:image/png;base64,${rawImageBase64})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `linear-gradient(to bottom, ${colors.primary}66, ${colors.secondary}66)`,
        }}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 32, paddingTop: 24 }}>
          <div
            style={{
              fontSize: headerFontSize,
              fontWeight: '700',
              color: 'white',
              fontFamily: 'Noto Sans CJK JP',
            }}
          >
            {worldName}
          </div>
          <div
            style={{
              width: 200,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.accent,
              marginTop: 4,
            }}
          />
        </div>
        <img
          src={`data:image/png;base64,${rawImageBase64}`}
          alt=""
          width={imageWidth}
          height={imageHeightConst}
          style={{
            position: 'absolute',
            top: imageY,
            left: imageX,
            borderRadius: 12,
            objectFit: 'cover',
          }}
        />
        {playerElementsHtml}
      </div>
    </div>
  );

  const satoriOptions = {
    width: 800,
    height: totalHeight,
    fonts: [
      {
        name: 'Noto Sans CJK JP',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ],
    // embedFont: true, // Default behavior
  };

  const svgString = await satori(jsx, satoriOptions);
  return { svg: svgString, height: totalHeight };
}

export async function generatePreviewPng(
  params: GeneratePreviewParams,
): Promise<string> {
  const { svg, height } = await generatePreviewSvg(params);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG image for PNG conversion'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = 800 * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
