import { create } from 'zustand';
import { generatePhotos } from '../data/photos';
import type { Photo } from '../types/photo';

interface PhotoSourceState {
  sourceType: 'local' | 'demo';
  settings: {
    photoDirectory: string;
    logFilePath: string;
  };
  photos: Photo[];
  lastUpdated: number;
  isRefreshing: boolean;
  setSourceType: (type: 'local' | 'demo') => void;
  updateSettings: (settings: {
    photoDirectory: string;
    logFilePath: string;
  }) => void;
  refreshPhotos: () => Promise<void>;
}

const loadPhotos = (
  sourceType: 'local' | 'demo',
  settings: { photoDirectory: string; logFilePath: string },
) => {
  if (sourceType === 'demo') {
    return generatePhotos();
  }
  return generatePhotos();
};

// ダミーの差分ロード処理
const loadNewPhotos = async (lastUpdated: number): Promise<Photo[]> => {
  // 実際の実装では lastUpdated 以降に追加された写真のみを取得
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPhotos = generatePhotos()
        .filter((photo) => photo.takenAt.getTime() > lastUpdated)
        .slice(0, 5); // デモ用に最大5枚まで
      resolve(newPhotos);
    }, 1500);
  });
};

const STORAGE_KEY = 'photo-source-settings';

const loadStoredSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return {
    sourceType: 'demo' as const,
    settings: {
      photoDirectory: '',
      logFilePath: '',
    },
  };
};

const initialState = loadStoredSettings();

export const usePhotoSource = create<PhotoSourceState>((set, get) => ({
  sourceType: initialState.sourceType,
  settings: initialState.settings,
  photos: loadPhotos(initialState.sourceType, initialState.settings),
  lastUpdated: Date.now(),
  isRefreshing: false,
  setSourceType: (type) => {
    set((state) => {
      const newState = {
        sourceType: type,
        settings: state.settings,
        photos: loadPhotos(type, state.settings),
        lastUpdated: Date.now(),
        isRefreshing: false,
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sourceType: type,
          settings: state.settings,
        }),
      );
      return newState;
    });
  },
  updateSettings: (settings) => {
    set((state) => {
      const newState = {
        sourceType: state.sourceType,
        settings,
        photos: loadPhotos(state.sourceType, settings),
        lastUpdated: Date.now(),
        isRefreshing: false,
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sourceType: state.sourceType,
          settings,
        }),
      );
      return newState;
    });
  },
  refreshPhotos: async () => {
    const state = get();
    if (state.isRefreshing) return;

    set({ isRefreshing: true });
    try {
      const newPhotos = await loadNewPhotos(state.lastUpdated);
      if (newPhotos.length > 0) {
        set((state) => ({
          photos: [...newPhotos, ...state.photos],
          lastUpdated: Date.now(),
          isRefreshing: false,
        }));
      } else {
        set({ isRefreshing: false });
      }
    } catch (error) {
      console.error('Failed to refresh photos:', error);
      set({ isRefreshing: false });
    }
  },
}));
