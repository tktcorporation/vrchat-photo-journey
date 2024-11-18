import { Photo } from '../types/photo';

// キャンバスを使用してダミー画像を生成
function generateDataUrl(width: number, height: number, text: string = ''): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // アスペクト比を表示
  ctx.fillStyle = '#6b7280';
  ctx.font = `${Math.min(width, height) * 0.1}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const aspectRatio = (width / height).toFixed(2);
  const displayText = `${width}x${height}\n${aspectRatio}`;
  const lines = displayText.split('\n');
  const lineHeight = Math.min(width, height) * 0.12;
  
  lines.forEach((line, i) => {
    const y = height / 2 + (i - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, width / 2, y);
  });

  return canvas.toDataURL('image/jpeg', 0.8);
}

// 写真データにローカル画像URLを追加
export function generateLocalImageUrl(photo: Photo): string {
  return generateDataUrl(photo.width, photo.height);
}

// アスペクト比に基づいて最適なサイズを計算
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = maxWidth;
  let height = maxWidth / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}