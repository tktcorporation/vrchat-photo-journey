import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { trpcReact } from '@/trpc';
import clsx from 'clsx';
import { CheckCircle2, Circle } from 'lucide-react';
import pathe from 'pathe';
import type React from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { P, match } from 'ts-pattern';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useI18n } from '../i18n/store';
import type { Photo } from '../types/photo';
import { generatePreviewPng } from '../utils/previewGenerator';
import ProgressiveImage from './ProgressiveImage';

/**
 * PhotoCard コンポーネントのプロパティ定義
 */
interface PhotoCardProps {
  /** 表示する写真オブジェクト */
  photo: Photo;
  /** 写真が属するワールドのID (Nullable) */
  worldId: string | null;
  /** 画像を優先的に読み込むか (ビューポート内の最初の要素など) */
  priority?: boolean;
  /** 写真本体がクリックされたときに呼び出されるコールバック (通常モード時、モーダル表示用) */
  onSelect: (photo: Photo) => void;
  /** 現在選択されている写真のIDセット */
  selectedPhotos: Set<string>;
  /** 選択されている写真のIDセットを更新する関数 */
  setSelectedPhotos: (
    update: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  /** このカードが含まれるグリッド全体の写真リスト (複数コピー時のパス取得用、将来的に不要かも) */
  photos: Photo[];
  /** 現在複数選択モードかどうか (ギャラリー全体の状態) */
  isMultiSelectMode: boolean;
  /** 複数選択モードの有効/無効を設定する関数 (ギャラリー全体の状態を更新) */
  setIsMultiSelectMode: (value: boolean) => void;
  /** 計算された表示高さ (オプション) */
  displayHeight?: number;
}

/**
 * グリッド内に表示される個々の写真カードコンポーネント。
 * 写真の表示、ホバーエフェクト、選択状態の表示、クリック/右クリックによるインタラクションを担当します。
 */
const PhotoCard: React.FC<PhotoCardProps> = memo(
  ({
    photo,
    worldId,
    priority = false,
    onSelect,
    selectedPhotos,
    setSelectedPhotos,
    photos,
    isMultiSelectMode,
    setIsMultiSelectMode,
    displayHeight,
  }) => {
    const { t } = useI18n();
    const elementRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    // Intersection Observer でビューポート内に入ったか判定
    const isIntersecting = useIntersectionObserver(elementRef, {
      threshold: 0,
      rootMargin: '200px',
    });

    const currentPhotoId = String(photo.id);
    /** このカードが現在選択されているかどうか */
    const isSelected = selectedPhotos.has(currentPhotoId);

    /** 画像を読み込むべきか (優先指定またはビューポート内) */
    const shouldLoad = priority || isIntersecting;
    const placeholderUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${photo.width} ${photo.height}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;

    // --- tRPC Hooks ---
    const validatePhotoPathMutation =
      trpcReact.vrchatPhoto.validateVRChatPhotoPath.useMutation();
    const { data: photoData } =
      trpcReact.vrchatPhoto.getVRChatPhotoItemData.useQuery(photo.url, {
        enabled: shouldLoad,
        onSuccess: (result) => {
          if (result.error === 'InputFileIsMissing') {
            validatePhotoPathMutation.mutate(photo.url);
          }
        },
      });
    const copySingleMutation =
      trpcReact.electronUtil.copyImageDataByPath.useMutation();
    const copyMultipleMutation =
      trpcReact.electronUtil.copyMultipleImageDataByPath.useMutation();
    const openInPhotoAppMutation =
      trpcReact.electronUtil.openPhotoPathWithPhotoApp.useMutation();
    const openDirOnExplorerMutation = trpcReact.openDirOnExplorer.useMutation();
    const { data: worldInfo } =
      trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(worldId ?? '', {
        enabled: !!worldId,
      });
    const { data: players } =
      trpcReact.logInfo.getPlayerListInSameWorld.useQuery(photo.takenAt);
    const copyMutation =
      trpcReact.electronUtil.copyImageDataByBase64.useMutation();
    const downloadMutation =
      trpcReact.electronUtil.downloadImageAsPng.useMutation();
    const getVRChatPhotoItemDataMutation =
      trpcReact.vrchatPhoto.getVRChatPhotoItemDataMutation.useMutation();

    // --- Event Handlers ---

    /** コンテキストメニュー: 写真データコピー (単一/複数対応) */
    const handleCopyPhotoData = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedPhotos.size > 1) {
        const pathsToCopy = Array.from(selectedPhotos)
          .map((id) => {
            const p = photos.find((p) => String(p.id) === id);
            return p?.url;
          })
          .filter(Boolean) as string[];
        console.log('Triggering multiple photo copy:', pathsToCopy);
        copyMultipleMutation.mutate(pathsToCopy);
      } else {
        copySingleMutation.mutate(photo.url);
      }
    };

    /** コンテキストメニュー: 写真アプリで開く */
    const handleOpenInPhotoApp = (e: React.MouseEvent) => {
      e.stopPropagation();
      openInPhotoAppMutation.mutate(photo.url);
    };

    /** コンテキストメニュー: フォルダで表示 */
    const handleOpenInExplorer = (e: React.MouseEvent) => {
      e.stopPropagation();
      openDirOnExplorerMutation.mutate(photo.url);
    };

    /** コンテキストメニュー: シェア画像生成 */
    const handleShare =
      (type: 'clipboard' | 'download') => async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('handleShare', type);
        const data = await getVRChatPhotoItemDataMutation.mutateAsync({
          photoPath: photo.url,
          width: undefined,
        });

        const cleanBase64 = data.replace(/^data:image\/[^;]+;base64,/, '');
        if (!cleanBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
          throw new Error('不正なBase64形式です');
        }

        const previewImage = await generatePreviewPng({
          worldName: worldInfo?.name ?? 'Unknown World',
          imageBase64: cleanBase64,
          players: match(players)
            .with(P.nullish, () => [])
            .with(P.array(), (players) =>
              players.map((player) => ({
                playerName: player.playerName,
              })),
            )
            .exhaustive(),
          showAllPlayers: false,
        });

        if (!previewImage || typeof previewImage !== 'string') {
          throw new Error('プレビュー画像の生成に失敗しました');
        }

        const base64WithPrefix = previewImage.startsWith('data:image/')
          ? previewImage
          : `data:image/png;base64,${previewImage}`;

        if (
          !base64WithPrefix.match(
            /^data:image\/[^;]+;base64,[A-Za-z0-9+/]*={0,2}$/,
          )
        ) {
          throw new Error('生成された画像が不正なBase64形式です');
        }

        if (type === 'clipboard') {
          await copyMutation.mutateAsync({
            pngBase64: base64WithPrefix,
            filenameWithoutExt: `${photo.fileNameWithExt.value}_share`,
          });
        } else {
          await downloadMutation.mutateAsync({
            pngBase64: base64WithPrefix,
            filenameWithoutExt: `${photo.fileNameWithExt.value}_share`,
          });
        }
        console.log('共有画像の生成とコピーが完了しました');
      };

    /** カード本体のクリックハンドラ */
    const handleClick = useCallback(() => {
      if (isMultiSelectMode) {
        // 複数選択モード中: 選択/選択解除
        setSelectedPhotos((prev) => {
          const newSelected = new Set(prev);
          if (newSelected.has(currentPhotoId)) {
            newSelected.delete(currentPhotoId);
          } else {
            newSelected.add(currentPhotoId);
          }
          return newSelected;
        });
      } else {
        // 通常モード中: モーダル表示
        onSelect(photo);
      }
    }, [isMultiSelectMode, currentPhotoId, setSelectedPhotos, onSelect, photo]);

    /** 左上の選択アイコンのクリックハンドラ */
    const handleSelectIconClick = useCallback(
      (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();

        if (!isMultiSelectMode) {
          setIsMultiSelectMode(true);
        }

        setSelectedPhotos((prev) => {
          const newSelected = new Set(prev);
          if (newSelected.has(currentPhotoId)) {
            newSelected.delete(currentPhotoId);
          } else {
            newSelected.add(currentPhotoId);
          }
          return newSelected;
        });
      },
      [
        isMultiSelectMode,
        setIsMultiSelectMode,
        currentPhotoId,
        setSelectedPhotos,
      ],
    );

    /** カードの右クリックハンドラ */
    const handleContextMenu = useCallback(() => {
      if (!isMultiSelectMode || !selectedPhotos.has(currentPhotoId)) {
        // モード外 or 未選択写真を右クリック: これを選択しモード開始
        setSelectedPhotos(new Set([currentPhotoId]));
        setIsMultiSelectMode(true);
      }
    }, [
      isMultiSelectMode,
      setIsMultiSelectMode,
      currentPhotoId,
      selectedPhotos,
      setSelectedPhotos,
    ]);

    /** コンテキストメニュー項目共通のアクションラッパー */
    const handleMenuAction = (
      e: React.MouseEvent,
      handler: (e: React.MouseEvent) => void,
    ) => {
      e.stopPropagation();
      handler(e);
    };

    // --- Render ---
    return (
      <div
        ref={elementRef}
        className={clsx(
          'group relative w-full bg-gray-100 dark:bg-gray-800 overflow-hidden transform transition-all duration-300',
          isMultiSelectMode ? 'cursor-pointer' : 'cursor-pointer',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          !isMultiSelectMode && 'hover:brightness-110',
        )}
        style={{ height: displayHeight ? `${displayHeight}px` : undefined }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-selected={isSelected}
      >
        <ContextMenu>
          <ContextMenuTrigger className="absolute inset-0">
            <div
              className={clsx(
                'absolute top-1 left-1 z-10 rounded-full transition-opacity duration-200',
                isMultiSelectMode || isHovering || isSelected
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100',
              )}
              onClick={handleSelectIconClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectIconClick(e);
                }
              }}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={t('common.contextMenu.copyPhotoData')}
              tabIndex={0}
            >
              {isSelected ? (
                <CheckCircle2
                  size={24}
                  className="text-blue-500 bg-white rounded-full"
                  strokeWidth={1.5}
                />
              ) : (
                <Circle
                  size={24}
                  className="text-white/70 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50"
                  strokeWidth={1.5}
                />
              )}
            </div>

            <div
              className={clsx(
                'h-full',
                isSelected && 'opacity-75 transition-opacity',
              )}
            >
              {shouldLoad ? (
                <ProgressiveImage
                  src={photoData?.data || ''}
                  placeholderSrc={placeholderUrl}
                  alt={photo.fileNameWithExt.value}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={priority ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse"
                  style={{ aspectRatio: `${photo.width / photo.height}` }}
                />
              )}
            </div>

            {!isMultiSelectMode && (
              <div
                className={clsx(
                  'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity',
                )}
              >
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-white font-medium truncate text-xs">
                    {photo.fileNameWithExt.value}
                  </h3>
                </div>
              </div>
            )}
          </ContextMenuTrigger>
          <ContextMenuContent onClick={(e) => e.stopPropagation()}>
            <ContextMenuItem
              onClick={(e) => handleMenuAction(e, handleCopyPhotoData)}
              disabled={selectedPhotos.size === 0 && !isSelected}
            >
              {selectedPhotos.size > 1
                ? t('common.contextMenu.copyPhotoData')
                : t('common.contextMenu.copyPhotoData')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => handleMenuAction(e, handleShare('clipboard'))}
            >
              {t('common.contextMenu.shareImage')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => handleMenuAction(e, handleShare('download'))}
            >
              {t('common.contextMenu.downloadImage')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => handleMenuAction(e, handleOpenInPhotoApp)}
            >
              {t('common.contextMenu.openInPhotoApp')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => handleMenuAction(e, handleOpenInExplorer)}
            >
              {t('common.contextMenu.showInExplorer')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  },
);

PhotoCard.displayName = 'PhotoCard';

export default PhotoCard;
