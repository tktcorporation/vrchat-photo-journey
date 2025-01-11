import { memo, useState } from 'react';
import type { ProcessStages } from '../hooks/useStartUpStage';
import GalleryContent from './PhotoGallery/GalleryContent';
import Header from './PhotoGallery/Header';
import SettingsModal from './settings/SettingsModal';

const PhotoGallery = memo((props: { startUpStages: ProcessStages }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEmptyGroups, setShowEmptyGroups] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
        showEmptyGroups={showEmptyGroups}
        onToggleEmptyGroups={() => setShowEmptyGroups((prev) => !prev)}
      />
      <GalleryContent
        searchQuery={searchQuery}
        showEmptyGroups={showEmptyGroups}
        isLoadingStartupSync={
          props.startUpStages.logsStored === 'inProgress' ||
          props.startUpStages.indexLoaded === 'inProgress'
        }
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
});

PhotoGallery.displayName = 'PhotoGallery';

export default PhotoGallery;
