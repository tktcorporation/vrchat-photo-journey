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
/**
 * 写真グループの高さを計測し `onMeasure` へ渡すコンポーネント。
 * GalleryContent の仮想スクロールで各グループのサイズ計算に使用される。
 */
export function MeasurePhotoGroup({
  photos,
  onMeasure,
}: MeasurePhotoGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const previousHeightRef = useRef<number>(0);
  const scrollCompensationRef = useRef<{ heightDelta?: number }>({});

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
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    let resizeObserver: ResizeObserver;
    try {
      resizeObserver = new ResizeObserver((entries) => {
        try {
          if (entries.length > 0) {
            handleResize();
          }
        } catch (error) {
          console.warn('ResizeObserver measurement error:', error);
        }
      });
    } catch (error) {
      console.warn('ResizeObserver creation failed:', error);
      return;
    }
    resizeObserver.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const compensateScroll = useCallback(() => {
    if (
      scrollCompensationRef.current.heightDelta &&
      containerRef.current?.parentElement?.parentElement
    ) {
      const scrollContainer = containerRef.current.parentElement.parentElement;
      scrollContainer.scrollBy(0, scrollCompensationRef.current.heightDelta);
      scrollCompensationRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (containerWidth === 0) return;

    const newHeight = calculateGridHeight(containerWidth);
    if (newHeight !== previousHeightRef.current) {
      const heightDelta = newHeight - previousHeightRef.current;
      previousHeightRef.current = newHeight;

      // Store height delta for scroll compensation
      if (heightDelta !== 0) {
        scrollCompensationRef.current.heightDelta = heightDelta;
        requestAnimationFrame(compensateScroll);
      }

      onMeasure(newHeight);
    }
  }, [containerWidth, calculateGridHeight, onMeasure, compensateScroll]);

  return <div ref={containerRef} className="w-full photo-group-measure" />;
}
