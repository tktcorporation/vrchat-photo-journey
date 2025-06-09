import { trpcReact } from '@/trpc';
import { memo, useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import type { UseLoadingStateResult } from '../hooks/useLoadingState';
import type { ProcessStages } from '../hooks/useStartUpStage';
import { useI18n } from '../i18n/store';
import GalleryContent from './PhotoGallery/GalleryContent';
import Header from './PhotoGallery/Header';
import { usePhotoGallery } from './PhotoGallery/usePhotoGallery';
import SettingsModal from './settings/SettingsModal';

interface PhotoGalleryProps extends UseLoadingStateResult {
  startUpStages: ProcessStages;
}

/**
 * 写真ギャラリーのメインコンポーネント
 * ヘッダー、ギャラリーコンテンツ、設定モーダルを表示します。
 * @param props.startUpStages - アプリ起動時の各処理段階の状態
 */
const PhotoGallery = memo((props: PhotoGalleryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();

  const {
    selectedPhotos,
    setSelectedPhotos,
    isMultiSelectMode,
    setIsMultiSelectMode,
    groupedPhotos,
  } = usePhotoGallery(searchQuery, {
    onGroupingEnd: props.finishLoadingGrouping,
  });

  /** 選択をクリアし、複数選択モードを解除するハンドラ */
  const handleClearSelection = () => {
    setSelectedPhotos(new Set());
    setIsMultiSelectMode(false);
  };

  // 複数画像をクリップボードにコピーするミューテーション
  const { mutate: copyMultipleImagesToClipboard } =
    trpcReact.electronUtil.copyMultipleImageDataByPath.useMutation({
      onSuccess: (_, variables) => {
        const count = variables.length;
        const _isWindows = navigator.platform.includes('Win');

        if (count > 1) {
          toast({
            title: `${count}枚の写真をコピーしました`,
            variant: 'default',
          });
        } else {
          toast({
            title: t('locationHeader.copied'),
            variant: 'default',
          });
        }
      },
      onError: (error) => {
        console.error('Failed to copy multiple images to clipboard:', error);
        toast({
          title: '写真のコピーに失敗しました',
          variant: 'destructive',
        });
      },
    });

  // 選択された写真をクリップボードにコピーするハンドラ
  const handleCopySelected = () => {
    if (selectedPhotos.size === 0) {
      return;
    }

    // 選択された写真のパスを取得
    const selectedPhotoUrls: string[] = [];

    // グループ内の写真からIDが一致するものを探す
    for (const group of Object.values(groupedPhotos)) {
      for (const photo of group.photos) {
        if (selectedPhotos.has(photo.id.toString())) {
          selectedPhotoUrls.push(photo.url);
        }
      }
    }

    // 写真をクリップボードにコピー
    if (selectedPhotoUrls.length > 0) {
      copyMultipleImagesToClipboard(selectedPhotoUrls);
    }
  };

  // Esc キーでの選択解除
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMultiSelectMode) {
        handleClearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMultiSelectMode, handleClearSelection]);

  return (
    <div className="flex flex-col h-full">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
        selectedPhotoCount={selectedPhotos.size}
        onClearSelection={handleClearSelection}
        isMultiSelectMode={isMultiSelectMode}
        onCopySelected={handleCopySelected}
        isRefreshing={props.isRefreshing}
        startRefreshing={props.startRefreshing}
        finishRefreshing={props.finishRefreshing}
      />
      <GalleryContent
        searchQuery={searchQuery}
        isLoadingStartupSync={props.isLoadingStartupSync}
        isLoadingGrouping={props.isLoadingGrouping}
        finishLoadingGrouping={props.finishLoadingGrouping}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
});

PhotoGallery.displayName = 'PhotoGallery';

export default PhotoGallery;
