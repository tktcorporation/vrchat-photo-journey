import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../types/photo';
import PhotoCard from './PhotoCard';

/**
 * PhotoGrid コンポーネントのプロパティ定義
 */
interface PhotoGridProps {
  /** 表示する写真オブジェクトの配列 */
  photos: Photo[];
  /** 写真が属するワールドのID (Nullable) */
  worldId: string | null;
  /** 写真がクリックされたときに呼び出されるコールバック (モーダル表示用) */
  onPhotoSelect: (photo: Photo) => void;
  /** 現在選択されている写真のIDセット */
  selectedPhotos: Set<string>;
  /** 選択されている写真のIDセットを更新する関数 */
  setSelectedPhotos: (
    update: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  /** 現在複数選択モードかどうか */
  isMultiSelectMode: boolean;
  /** 複数選択モードの有効/無効を設定する関数 */
  setIsMultiSelectMode: (value: boolean) => void;
}

const TARGET_ROW_HEIGHT = 200; // 目標の行の高さ
const GAP = 4; // 写真間のギャップ

/** レイアウト計算用の中間的な写真データ型 */
interface LayoutPhoto extends Photo {
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
}

/**
 * 写真をレスポンシブなグリッドレイアウトで表示するコンポーネント。
 * 各写真は PhotoCard としてレンダリングされます。
 *
 * ## 動的レイアウトアルゴリズム
 *
 * このコンポーネントは「Justified Layout」アルゴリズムを実装しており、
 * Google Photos のように各行の写真を親要素の幅にぴったり収めます。
 *
 * ### レイアウト計算の流れ
 *
 * 1. **コンテナ幅の監視**
 *    - ResizeObserver でコンテナ幅の変化をリアルタイムに検知
 *    - 幅が変化するたびにレイアウトを再計算
 *
 * 2. **行への写真配分**
 *    - 目標行高さ (TARGET_ROW_HEIGHT: 200px) を基準に初期サイズを計算
 *    - 写真を順に行に追加し、行幅がコンテナ幅を超えたら次の行へ
 *
 * 3. **行内写真のスケーリング**
 *    - 各行の写真を比例的に拡大/縮小して親幅にフィット
 *    - アスペクト比を保持しながら、隙間を除いた幅を完全に埋める
 *    - 最後の行は最大1.5倍までスケールアップして空白を減らす
 *
 * ### バーチャルスクロールとの連携
 *
 * このコンポーネントは GalleryContent のバーチャルスクロールと密接に連携します：
 *
 * - **高さの予測性**: calculateLayout のアルゴリズムは MeasurePhotoGroup でも使用され、
 *   実際のレンダリング前に高さを予測するために必要
 *
 * - **動的リサイズ**: コンテナ幅が変化すると高さも変化するため、
 *   バーチャルスクローラーに高さの再計測を通知する必要がある
 *
 * - **パフォーマンス**: レイアウト計算は useMemo でメモ化され、
 *   不要な再計算を避けてスムーズなスクロールを実現
 *
 * @warning このレイアウトアルゴリズムは MeasurePhotoGroup と完全に一致している必要があります。
 * 両者の計算がずれると、バーチャルスクロールでセクションが重なる原因となります。
 */
export default function PhotoGrid({
  photos,
  worldId,
  onPhotoSelect,
  selectedPhotos,
  setSelectedPhotos,
  isMultiSelectMode,
  setIsMultiSelectMode,
}: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // コンテナ幅の変更を監視してレイアウトを再計算
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

  // 写真を行ベースの justify レイアウトで配置計算するロジック
  const calculateLayout = useCallback(
    (width: number): LayoutPhoto[][] => {
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

        // 現在の行に追加した場合の合計幅（ギャップを含む）
        const totalWidthWithPhoto =
          currentRow.length > 0 ? rowWidth + photoWidth + GAP : photoWidth;

        if (totalWidthWithPhoto > width && currentRow.length > 0) {
          // 現在の行を確定（行幅を親要素にぴったり合わせる）
          const totalGaps = (currentRow.length - 1) * GAP;
          const availableWidth = width - totalGaps;
          const scale = availableWidth / (rowWidth - currentRow.length * GAP);

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
        rowWidth += photoWidth + (currentRow.length > 1 ? GAP : 0);
      }

      // 最後の行を処理
      if (currentRow.length > 0) {
        if (currentRow.length === 1) {
          // 1枚だけの場合は幅を制限しつつ中央寄せを考慮
          const photo = currentRow[0];
          const aspectRatio = photo.width / photo.height;
          const maxWidth = Math.min(TARGET_ROW_HEIGHT * aspectRatio, width);
          photo.displayHeight = Math.min(
            TARGET_ROW_HEIGHT,
            maxWidth / aspectRatio,
          );
          photo.displayWidth = photo.displayHeight * aspectRatio;
        } else {
          // 複数枚の場合は他の行と同様に幅をフィット
          const totalGaps = (currentRow.length - 1) * GAP;
          const availableWidth = width - totalGaps;
          const currentTotalWidth = rowWidth - currentRow.length * GAP;

          // 最後の行が短すぎる場合は最大1.5倍までスケールアップ
          const maxScale = Math.min(availableWidth / currentTotalWidth, 1.5);
          const scale = maxScale;

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

  // コンテナ幅または写真リストが変わったらレイアウトを再計算
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
                    className={clsx('relative transition-all duration-300')}
                  >
                    <PhotoCard
                      photo={photo}
                      worldId={worldId}
                      onSelect={onPhotoSelect}
                      priority={index === 0}
                      selectedPhotos={selectedPhotos}
                      setSelectedPhotos={setSelectedPhotos}
                      photos={photos}
                      isMultiSelectMode={isMultiSelectMode}
                      setIsMultiSelectMode={setIsMultiSelectMode}
                      displayHeight={photo.displayHeight}
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
