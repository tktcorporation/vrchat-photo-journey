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

  // コンテナ幅または写真リストが変わったらレイアウトを再計算
  const layout = useMemo(
    () => calculateLayout(containerWidth),
    [calculateLayout, containerWidth],
  );

  return (
    <div ref={containerRef} className="w-full photo-grid">
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
