import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [containerWidth, setContainerWidth] = useState(0);
  const previousHeightRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<number>();

  const calculateGridHeight = useCallback(
    (width: number) => {
      if (width === 0) return 0;

      let totalHeight = HEADER_HEIGHT + CONTAINER_PADDING;

      // 写真がない場合は固定の高さを返す
      if (photos.length === 0) {
        return totalHeight; // 空のグループの高さ
      }

      let currentRowWidth = 0;
      let currentRowPhotos = 0;

      for (const photo of photos) {
        const aspectRatio = (photo.width || 1920) / (photo.height || 1080);
        const photoWidth = TARGET_ROW_HEIGHT * aspectRatio;

        if (
          currentRowWidth + photoWidth + GAP > width &&
          currentRowPhotos > 0
        ) {
          // 行の高さを計算して追加
          const scale =
            (width - (currentRowPhotos - 1) * GAP) / currentRowWidth;
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
            (width - (currentRowPhotos - 1) * GAP) / currentRowWidth;
          totalHeight += TARGET_ROW_HEIGHT * scale + GAP;
        }
      }

      return Math.ceil(totalHeight);
    },
    [photos],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth);
        }
      }, 100);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);

    return () => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (containerWidth === 0) return;

    const newHeight = calculateGridHeight(containerWidth);
    if (newHeight !== previousHeightRef.current) {
      previousHeightRef.current = newHeight;
      onMeasure(newHeight);
    }
  }, [containerWidth, calculateGridHeight, onMeasure]);

  return <div ref={containerRef} className="w-full" />;
}
