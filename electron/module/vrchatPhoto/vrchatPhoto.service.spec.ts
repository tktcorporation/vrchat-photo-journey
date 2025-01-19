import { app } from 'electron';
import { glob } from 'glob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type SettingStore, getSettingStore } from '../settingStore';
import { VRChatPhotoDirPathSchema } from './valueObjects';
import {
  getVRChatPhotoItemData,
  getVRChatPhotoList,
} from './vrchatPhoto.service';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
  },
}));

vi.mock('../settingStore', () => ({
  getSettingStore: vi.fn(),
}));

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

vi.mock('sharp', () => {
  const mockMetadata = vi.fn().mockResolvedValue({ width: 1920, height: 1080 });
  const mockSharp = vi.fn().mockImplementation(() => ({
    metadata: mockMetadata,
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('dummy')),
  }));
  return {
    default: mockSharp,
  };
});

describe('vrchatPhoto.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getVRChatPhotoItemData', async () => {
    const input = '/path/to/hogehoge.jpg';
    const sharp = (await import('sharp')).default;
    vi.mocked(sharp).mockImplementation(() => {
      throw new Error('Input file is missing');
    });

    const result = await getVRChatPhotoItemData({
      photoPath: input,
      width: 256,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('InputFileIsMissing');
    }
  });

  describe('getVRChatPhotoList', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('Windows環境で写真が見つからない場合は空配列を返す', async () => {
      // Windows環境をモック
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      vi.mocked(glob).mockResolvedValue([]);

      const mockSettingStore: SettingStore = {
        __store: {} as SettingStore['__store'],
        getLogFilesDir: vi.fn(),
        setLogFilesDir: vi.fn(),
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        setVRChatPhotoDir: vi.fn(),
        getVRChatPhotoExtraDirList: vi
          .fn()
          .mockReturnValue([
            VRChatPhotoDirPathSchema.parse(
              'C:\\Users\\TestUser\\Pictures\\VRChat\\Extra1',
            ),
            VRChatPhotoDirPathSchema.parse(
              'C:\\Users\\TestUser\\Pictures\\VRChat\\Extra2',
            ),
          ]),
        setVRChatPhotoExtraDirList: vi.fn(),
        clearStoredSetting: vi.fn(),
        getTermsVersion: vi.fn(),
        setTermsVersion: vi.fn(),
        getRemoveAdjacentDuplicateWorldEntriesFlag: vi.fn(),
        setRemoveAdjacentDuplicateWorldEntriesFlag: vi.fn(),
        getBackgroundFileCreateFlag: vi.fn(),
        setBackgroundFileCreateFlag: vi.fn(),
        clearAllStoredSettings: vi.fn(),
        setWindowBounds: vi.fn(),
        getWindowBounds: vi.fn(),
        getTermsAccepted: vi.fn(),
        setTermsAccepted: vi.fn(),
      };
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );
      expect(result).toEqual([]);
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );
    });

    it('Windows環境で写真が正しく検索される', async () => {
      // Windows環境をモック
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      vi.mocked(glob).mockResolvedValue([
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-00-00.000_1920x1080.png',
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-01-00.000_1920x1080.png',
      ]);

      const mockSettingStore: SettingStore = {
        __store: {} as SettingStore['__store'],
        getLogFilesDir: vi.fn(),
        setLogFilesDir: vi.fn(),
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        setVRChatPhotoDir: vi.fn(),
        getVRChatPhotoExtraDirList: vi
          .fn()
          .mockReturnValue([
            VRChatPhotoDirPathSchema.parse(
              'C:\\Users\\TestUser\\Pictures\\VRChat\\Extra1',
            ),
            VRChatPhotoDirPathSchema.parse(
              'C:\\Users\\TestUser\\Pictures\\VRChat\\Extra2',
            ),
          ]),
        setVRChatPhotoExtraDirList: vi.fn(),
        clearStoredSetting: vi.fn(),
        getTermsVersion: vi.fn(),
        setTermsVersion: vi.fn(),
        getRemoveAdjacentDuplicateWorldEntriesFlag: vi.fn(),
        setRemoveAdjacentDuplicateWorldEntriesFlag: vi.fn(),
        getBackgroundFileCreateFlag: vi.fn(),
        setBackgroundFileCreateFlag: vi.fn(),
        clearAllStoredSettings: vi.fn(),
        setWindowBounds: vi.fn(),
        getWindowBounds: vi.fn(),
        getTermsAccepted: vi.fn(),
        setTermsAccepted: vi.fn(),
      };
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );
      expect(result.length).toBe(2);
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );
    });
  });
});
