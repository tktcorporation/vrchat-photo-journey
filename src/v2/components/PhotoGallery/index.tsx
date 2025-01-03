import { memo, useState } from 'react';
import SettingsModal from '../settings/SettingsModal';
import GalleryContent from './GalleryContent';
import Header from './Header';

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
