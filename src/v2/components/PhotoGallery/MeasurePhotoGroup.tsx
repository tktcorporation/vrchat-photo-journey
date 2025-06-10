import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo } from '../../types/photo';

interface MeasurePhotoGroupProps {
  photos: Photo[];
  onMeasure: (height: number) => void;
}

const HEADER_HEIGHT = 96; // LocationGroupHeaderの高さ (h-24 = 96px)
const GAP = 4; // 写真間のギャップ
const TARGET_ROW_HEIGHT = 200; // 目標の行の高さ
const SPACING = 8; // ヘッダーとグリッド間のスペース (space-y-2 = 8px)
/**
 * 写真グループの高さを計測し `onMeasure` へ渡すコンポーネント。
 * GalleryContent の仮想スクロールで各グループのサイズ計算に使用される。
 *
 * ## バーチャルスクロールのための予測的高さ計算
 *
 * このコンポーネントは、実際の PhotoGrid がレンダリングされる前に、
 * バーチャルスクローラーに大まかな高さの推定値を提供します。
 *
 * ### 計算ロジック
 *
 * 1. **PhotoGrid と同一のアルゴリズムを使用**
 *    - calculateLayout 関数で PhotoGrid と同じ Justified Layout を計算
 *    - 各行の高さを累計し、ギャップも含めた総高さを算出
 *
 * 2. **コンテナ幅の取得**
 *    - ResizeObserver で親要素の幅を監視
 *    - 幅が変化するたびに高さを再計算
 *
 * 3. **追加要素の考慮**
 *    - HEADER_HEIGHT: LocationGroupHeader の高さ (h-24 = 96px)
 *    - SPACING: ヘッダーとグリッド間のスペース (space-y-2 = 8px)
 *
 * ### バーチャルスクロールとの連携
 *
 * - **初期推定**: バーチャルスクローラーの estimateSize がこの計算値を使用
 * - **実測値への更新**: 実際のレンダリング後、measureElement が実測値で上書き
 * - **スムーズなスクロール**: 予測値と実測値の差が小さいほどスムーズ
 *
 * @warning この計算で使用される定数値は実際のレンダリング要素と一致している必要があります。
 * 不一致があると、バーチャルスクロールでセクションが重なる原因となります。
 */
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

      let totalHeight = HEADER_HEIGHT + SPACING;

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
