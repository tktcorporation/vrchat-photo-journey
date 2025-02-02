import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../types/photo';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  worldId: string | null;
  onPhotoSelect: (photo: Photo) => void;
  setLastSelectedPhoto: (photo: Photo | null) => void;
  lastSelectedPhotoId?: string | number;
}

const TARGET_ROW_HEIGHT = 200; // 目標の行の高さ
const GAP = 4; // 写真間のギャップ

interface LayoutPhoto extends Photo {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
}

export default function PhotoGrid({
  photos,
  worldId,
  onPhotoSelect,
  setLastSelectedPhoto,
  lastSelectedPhotoId,
}: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    updateWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const calculateLayout = useCallback(
    (width: number) => {
      if (width === 0) return [];

      const rows: LayoutPhoto[][] = [];
      let currentRow: LayoutPhoto[] = [];
      let rowWidth = 0;

      // 写真をレイアウト用に変換
      const layoutPhotos: LayoutPhoto[] = photos.map((photo) => ({
        ...photo,
        width: photo.width || 1920,
        height: photo.height || 1080,
        displayWidth: 0,
        displayHeight: 0,
      }));

      // 写真を行に分配
      for (const photo of layoutPhotos) {
        const aspectRatio = photo.width / photo.height;
        const photoWidth = TARGET_ROW_HEIGHT * aspectRatio;

        if (rowWidth + photoWidth + GAP > width && currentRow.length > 0) {
          // 現在の行を確定
          const scale = (width - (currentRow.length - 1) * GAP) / rowWidth;
          for (const p of currentRow) {
            p.displayHeight = TARGET_ROW_HEIGHT * scale;
            p.displayWidth = p.displayHeight * (p.width / p.height);
          }
          rows.push(currentRow);
          currentRow = [];
          rowWidth = 0;
        }

        currentRow.push({
          ...photo,
          displayWidth: photoWidth,
          displayHeight: TARGET_ROW_HEIGHT,
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
          photo.displayWidth = Math.min(TARGET_ROW_HEIGHT * aspectRatio, width);
        } else {
          // 最後の行もアスペクト比を調整
          const scale = (width - (currentRow.length - 1) * GAP) / rowWidth;
          for (const p of currentRow) {
            p.displayHeight = TARGET_ROW_HEIGHT * scale;
            p.displayWidth = p.displayHeight * (p.width / p.height);
          }
        }
        rows.push(currentRow);
      }

      return rows;
    },
    [photos],
  );

  const layout = useMemo(
    () => calculateLayout(containerWidth),
    [calculateLayout, containerWidth],
  );

  return (
    <div ref={containerRef} className="w-full">
      <div className="space-y-1">
        {layout.map((row, rowIndex) => {
          const rowKey = `row-${rowIndex}-${row[0]?.id}`;
          return (
            <div
              key={rowKey}
              className="flex gap-1"
              style={{
                height: row[0]?.displayHeight ?? TARGET_ROW_HEIGHT,
              }}
            >
              {row.map((photo, index) => {
                const photoKey = `photo-${rowIndex}-${photo.id}-${index}`;
                return (
                  <div
                    key={photoKey}
                    style={{
                      width: photo.displayWidth,
                      flexShrink: 0,
                    }}
                    className={clsx(
                      'relative aspect-video transition-all duration-300',
                      photo.id === lastSelectedPhotoId &&
                        'ring-2 ring-blue-400 ring-offset-2 shadow-[0_0_30px_2px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_2px_rgba(147,197,253,0.3)]',
                    )}
                  >
                    <PhotoCard
                      photo={photo}
                      worldId={worldId}
                      onSelect={onPhotoSelect}
                      setLastSelectedPhoto={setLastSelectedPhoto}
                      priority={index === 0}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
