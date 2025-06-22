import { rgbToHsl } from './colorUtils';

/**
 * 画像要素をキャンバスに描画し、そのピクセルデータを取得するヘルパー。
 * `extractDominantColors` からのみ利用される内部関数。
 */
function getPixelData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function calcColors(data: Uint8ClampedArray, step: number) {
  const colorBuckets: { [key: string]: ColorBucket } = {};

  for (let i = 0; i < data.length; i += step) {
    const r = Math.floor(data[i] / 5) * 5;
    const g = Math.floor(data[i + 1] / 5) * 5;
    const b = Math.floor(data[i + 2] / 5) * 5;
    const alpha = data[i + 3] / 255;

    if (alpha < 0.5) continue;

    const hsl = rgbToHsl(r, g, b);
    const [, s, l] = hsl;

    if (s < 20 || l < 15 || l > 85) continue;

    const key = `${r},${g},${b}`;

    if (colorBuckets[key]) {
      colorBuckets[key].count++;
    } else {
      colorBuckets[key] = { r, g, b, count: 1, hsl };
    }
  }

  const sortedColors = Object.values(colorBuckets)
    .sort((a, b) => b.count - a.count)
    .filter((bucket) => bucket.count > 20);

  if (sortedColors.length === 0) {
    return {
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(147, 51, 234)',
      accent: 'rgb(79, 70, 229)',
    };
  }

  const hueGroups: { [key: number]: ColorBucket[] } = {};
  for (const color of sortedColors) {
    const hueGroup = Math.floor(color.hsl[0] / 30);
    if (!hueGroups[hueGroup]) {
      hueGroups[hueGroup] = [];
    }
    hueGroups[hueGroup].push(color);
  }

  const hueGroupsArray = Object.values(hueGroups).sort(
    (a, b) => b[0].count - a[0].count,
  );

  const primary = hueGroupsArray[0]?.[0] || sortedColors[0];
  const secondary =
    hueGroupsArray[1]?.[0] || sortedColors[Math.floor(sortedColors.length / 3)];
  const accent =
    hueGroupsArray[2]?.[0] || sortedColors[Math.floor(sortedColors.length / 2)];

  return {
    primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
    secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
    accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})`,
  };
}

interface ColorBucket {
  r: number;
  g: number;
  b: number;
  count: number;
  hsl: [number, number, number];
}

/**
 * 与えられた画像から主要な色を抽出する関数。
 * `BoldPreview` や `previewGenerator` で背景色を決定するために使われる。
 */
export function extractDominantColors(img: HTMLImageElement) {
  const imageData = getPixelData(img);
  return calcColors(imageData.data, 4);
}

export async function extractDominantColorsFromBase64(imageBase64: string) {
  const img = new Image();
  img.src = `data:image/png;base64,${imageBase64}`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });

  const imageData = getPixelData(img);
  return calcColors(imageData.data, 20);
}
