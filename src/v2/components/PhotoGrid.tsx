import { useMemo } from 'react';
import type { Photo } from '../types/photo';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
}

const TARGET_ROW_HEIGHT = 200; // 目標の行の高さ
const GAP = 4; // 写真間のギャップ

interface LayoutPhoto extends Photo {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
}

export default function PhotoGrid({ photos, onPhotoSelect }: PhotoGridProps) {
  const layout = useMemo(() => {
    const rows: (LayoutPhoto & { rowIndex: number })[][] = [];
    let currentRow: (LayoutPhoto & { rowIndex: number })[] = [];
    let rowWidth = 0;
    let rowIndex = 0;
    const containerWidth = window.innerWidth - 48; // パディングを考慮

    // 写真をレイアウト用に変換
    const layoutPhotos: (LayoutPhoto & { rowIndex: number })[] = photos.map(
      (photo) => ({
        ...photo,
        width: photo.width || 1920,
        height: photo.height || 1080,
        displayWidth: 0,
        displayHeight: 0,
        rowIndex: 0,
      }),
    );

    // 写真を行に分配
    for (const photo of layoutPhotos) {
      const aspectRatio = photo.width / photo.height;
      const photoWidth = TARGET_ROW_HEIGHT * aspectRatio;

      if (
        rowWidth + photoWidth + GAP > containerWidth &&
        currentRow.length > 0
      ) {
        // 現在の行を確定
        const scale =
          (containerWidth - (currentRow.length - 1) * GAP) / rowWidth;
        for (const p of currentRow) {
          p.displayHeight = TARGET_ROW_HEIGHT * scale;
          p.displayWidth = p.displayHeight * (p.width / p.height);
          p.rowIndex = rowIndex;
        }
        rows.push(currentRow);
        currentRow = [];
        rowWidth = 0;
        rowIndex++;
      }

      currentRow.push({
        ...photo,
        displayWidth: photoWidth,
        displayHeight: TARGET_ROW_HEIGHT,
        rowIndex,
      });
      rowWidth += photoWidth + GAP;
    }

    // 最後の行を処理
    if (currentRow.length > 0) {
      if (currentRow.length === 1 || rows.length === 0) {
        // 1枚だけの場合は特別処理
        const photo = currentRow[0];
        const aspectRatio = photo.width / photo.height;
        photo.displayHeight = TARGET_ROW_HEIGHT;
        photo.displayWidth = TARGET_ROW_HEIGHT * aspectRatio;
        photo.rowIndex = rowIndex;
      } else {
        // 最後の行もアスペクト比を調整
        const scale =
          (containerWidth - (currentRow.length - 1) * GAP) / rowWidth;
        for (const p of currentRow) {
          p.displayHeight = TARGET_ROW_HEIGHT * scale;
          p.displayWidth = p.displayHeight * (p.width / p.height);
          p.rowIndex = rowIndex;
        }
      }
      rows.push(currentRow);
    }

    return rows;
  }, [photos]);

  return (
    <div className="space-y-1">
      {layout.map((row) => {
        const rowKey = `row-${row[0]?.rowIndex}-${row[0]?.id}`;
        return (
          <div
            key={rowKey}
            className="flex gap-1"
            style={{
              height: row[0]?.displayHeight ?? TARGET_ROW_HEIGHT,
            }}
          >
            {row.map((photo, index) => {
              const photoKey = `photo-${photo.rowIndex}-${photo.id}-${index}`;
              return (
                <div
                  key={photoKey}
                  style={{
                    width: photo.displayWidth,
                    flexShrink: 0,
                  }}
                >
                  <PhotoCard
                    photo={photo}
                    onSelect={onPhotoSelect}
                    priority={index === 0}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
