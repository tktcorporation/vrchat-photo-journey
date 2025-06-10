import { useEffect, useMemo, useRef } from 'react';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import type { Photo } from '../../types/photo';
import { JustifiedLayoutCalculator } from '../../utils/justifiedLayoutCalculator';

interface MeasurePhotoGroupProps {
  photos: Photo[];
  onMeasure: (height: number) => void;
}
/**
 * 写真グループの高さを計測し `onMeasure` へ渡すコンポーネント。
 * GalleryContent の仮想スクロールで各グループのサイズ計算に使用される。
 *
 * ## 統一されたバーチャルスクロール高さ予測
 *
 * このコンポーネントは JustifiedLayoutCalculator を使用して、
 * 実際の PhotoGrid がレンダリングされる前に正確な高さの推定値を提供します。
 *
 * ### 計算ロジック
 *
 * 1. **PhotoGrid と完全に同一のアルゴリズム**
 *    - JustifiedLayoutCalculator.calculateTotalHeight() を使用
 *    - PhotoGrid と 100% 同じ計算ロジックで高さを予測
 *
 * 2. **共通化されたコンテナ幅監視**
 *    - useContainerWidth フックで幅の変化を効率的に監視
 *    - PhotoGrid と同じパフォーマンス最適化を適用
 *
 * 3. **一元管理された定数**
 *    - LAYOUT_CONSTANTS で管理された統一定数を使用
 *    - 設定変更時の同期問題を完全に解消
 *
 * ### データ整合性の保証
 *
 * - **計算統一**: PhotoGrid と同じ JustifiedLayoutCalculator を使用
 * - **定数統一**: LAYOUT_CONSTANTS で一元管理
 * - **予測精度**: 実測値との差を最小化してスムーズなスクロールを実現
 *
 * @note リファクタリングにより、PhotoGrid との計算ロジック重複を完全に解消し、
 * データ整合性とメンテナンス性を大幅に向上しました。
 */
export function MeasurePhotoGroup({
  photos,
  onMeasure,
}: MeasurePhotoGroupProps) {
  const { containerRef, containerWidth } = useContainerWidth();
  const calculator = useMemo(() => new JustifiedLayoutCalculator(), []);
  const previousHeightRef = useRef<number>(0);

  useEffect(() => {
    if (containerWidth === 0) return;

    const newHeight = calculator.calculateTotalHeight(photos, containerWidth);
    if (newHeight !== previousHeightRef.current) {
      previousHeightRef.current = newHeight;
      onMeasure(newHeight);
    }
  }, [containerWidth, calculator, photos, onMeasure]);

  return <div ref={containerRef} className="w-full" />;
}
