import { useEffect, useRef } from 'react';
import type { Photo } from '../../types/photo';

interface MeasurePhotoGroupProps {
  photos: Photo[];
  onMeasure: (height: number) => void;
}

const HEADER_HEIGHT = 40; // LocationGroupHeaderの高さ
const GAP = 4; // 写真間のギャップ
const TARGET_ROW_HEIGHT = 200; // 目標の行の高さ
const CONTAINER_PADDING = 16; // コンテナのパディング

export function MeasurePhotoGroup({
  photos,
  onMeasure,
}: MeasurePhotoGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateGridHeight = () => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      if (containerWidth === 0) return 0;

      let totalHeight = HEADER_HEIGHT + CONTAINER_PADDING;
      let currentRowWidth = 0;
      let currentRowPhotos = 0;

      for (const photo of photos) {
        const aspectRatio = (photo.width || 1920) / (photo.height || 1080);
        const photoWidth = TARGET_ROW_HEIGHT * aspectRatio;

        if (
          currentRowWidth + photoWidth + GAP > containerWidth &&
          currentRowPhotos > 0
        ) {
          // 行の高さを計算して追加
          const scale =
            (containerWidth - (currentRowPhotos - 1) * GAP) / currentRowWidth;
          totalHeight += TARGET_ROW_HEIGHT * scale + GAP;
          currentRowWidth = 0;
          currentRowPhotos = 0;
        }

        currentRowWidth += photoWidth + GAP;
        currentRowPhotos++;
      }

      // 最後の行を処理
      if (currentRowPhotos > 0) {
        if (currentRowPhotos === 1) {
          totalHeight += TARGET_ROW_HEIGHT + GAP;
        } else {
          const scale =
            (containerWidth - (currentRowPhotos - 1) * GAP) / currentRowWidth;
          totalHeight += TARGET_ROW_HEIGHT * scale + GAP;
        }
      }

      return totalHeight;
    };

    const resizeObserver = new ResizeObserver(() => {
      const height = calculateGridHeight();
      onMeasure(height);
    });

    resizeObserver.observe(containerRef.current);

    // 初回計算
    const height = calculateGridHeight();
    onMeasure(height);

    return () => {
      resizeObserver.disconnect();
    };
  }, [photos, onMeasure]);

  return <div ref={containerRef} className="w-full" />;
}
