import { memo, useState } from 'react';
import GalleryContent from './PhotoGallery/GalleryContent';
import Header from './PhotoGallery/Header';
import SettingsModal from './settings/SettingsModal';

const PhotoGallery = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEmptyGroups, setShowEmptyGroups] = useState(false);

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
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
});

PhotoGallery.displayName = 'PhotoGallery';

export default PhotoGallery;
