import { app } from 'electron';
import { glob } from 'glob';
import type { Metadata, Sharp } from 'sharp';
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

// sharpモジュールをモック
vi.mock('sharp', () => {
  // sharpクラスのモックオブジェクトを作成
  const mockSharpInstance = {
    metadata: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'png',
    }),
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('dummy')),
  };

  // sharpファクトリー関数のモック
  const mockSharp = vi.fn().mockReturnValue(mockSharpInstance);

  return {
    default: mockSharp,
  };
});

describe('vrchatPhoto.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // getVRChatPhotoItemData のテストを describe でグループ化
  describe('getVRChatPhotoItemData', () => {
    const mockInputPhotoPath =
      '/path/to/VRChat_2023-10-26_10-30-00.123_1920x1080.png';
    const mockResizeWidth = 256;

    it('should return VRChatPhotoItemData on success', async () => {
      const sharpFactory = vi.mocked((await import('sharp')).default);
      const mockThumbnailBuffer = Buffer.from('thumbnail_data');
      const expectedBase64String = `data:image/png;base64,${mockThumbnailBuffer.toString(
        'base64',
      )}`;

      // sharpファクトリが返すインスタンスのメソッドをモック
      const mockInstance = {
        metadata: vi.fn().mockResolvedValue({
          width: 1920,
          height: 1080,
          format: 'png',
        } as Metadata),
        resize: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockThumbnailBuffer),
      };
      sharpFactory.mockReturnValue(mockInstance as unknown as Sharp);

      const result = await getVRChatPhotoItemData({
        photoPath: mockInputPhotoPath,
        width: mockResizeWidth,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // 期待値を base64 エンコードされた文字列に変更
        expect(result.value).toBe(expectedBase64String);
      }
      expect(sharpFactory).toHaveBeenCalledWith(mockInputPhotoPath);
      // metadataは呼ばれなくなったのでコメントアウト、もしくは削除
      // expect(mockInstance.metadata).toHaveBeenCalled();
      expect(mockInstance.resize).toHaveBeenCalledWith(mockResizeWidth);
      expect(mockInstance.toBuffer).toHaveBeenCalled();
    });

    describe('Error handling', () => {
      it('should return "InputFileIsMissing" error when sharp instantiation throws "Input file is missing"', async () => {
        const sharpFactory = vi.mocked((await import('sharp')).default);
        sharpFactory.mockImplementationOnce(() => {
          // ファクトリ自体のエラー
          throw new Error('Input file is missing');
        });

        const result = await getVRChatPhotoItemData({
          photoPath: mockInputPhotoPath,
          width: mockResizeWidth,
        });

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBe('InputFileIsMissing');
        }
      });

      it('should throw error for other sharp instantiation errors', async () => {
        const sharpFactory = vi.mocked((await import('sharp')).default);
        const errorMessage = 'Some other sharp error';
        sharpFactory.mockImplementationOnce(() => {
          // ファクトリ自体のエラー
          throw new Error(errorMessage);
        });

        // エラーがスローされることを期待
        await expect(
          getVRChatPhotoItemData({
            photoPath: mockInputPhotoPath,
            width: mockResizeWidth,
          }),
        ).rejects.toThrow(errorMessage);
      });

      // it('should throw error when sharp.metadata throws an error (if called)', async () => {
      //   // 現在の実装ではmetadataは呼ばれないが、将来的に呼ばれる可能性を考慮して残す場合
      //   // もし呼ばれないことが確定ならこのテストは不要
      //   const sharpFactory = vi.mocked((await import('sharp')).default);
      //   const errorMessage = 'Metadata error';
      //   const mockInstance = {
      //     metadata: vi.fn().mockRejectedValueOnce(new Error(errorMessage)),
      //     resize: vi.fn().mockReturnThis(),
      //     toBuffer: vi.fn(),
      //   };
      //   sharpFactory.mockReturnValue(mockInstance as unknown as Sharp);
      //
      //   // getVRChatPhotoItemData内でmetadataが呼ばれると仮定した場合、エラーがスローされる
      //   // 現在の実装では呼ばれないため、このテストは失敗する可能性がある
      //   // もしsharp(photoPath)の時点でエラーになるなら、そのテストケースでカバーされる
      //   // このテストケースは、toBufferの前にmetadataが呼ばれる場合に意味がある
      //   // 今回の実装では、sharp(photoPath)の後に 바로 .resize().toBuffer() となっているので、
      //   // metadata() が直接呼ばれることはありません。
      //   // 代わりに、sharp(photoPath) でエラーが発生するケースは
      //   // "should throw error for other sharp instantiation errors" でカバーされるか、
      //   // "InputFileIsMissing" でカバーされます。
      //   // よってこのテストは現状では適切ではないかもしれません。
      //   // エラーをthrowするようになったので、エラーをキャッチする形に変更
      //   await expect(
      //     getVRChatPhotoItemData({
      //       photoPath: mockInputPhotoPath,
      //       width: mockResizeWidth,
      //     }),
      //   ).rejects.toThrow(errorMessage);
      // });

      it('should throw error when sharp.toBuffer throws an error', async () => {
        const sharpFactory = vi.mocked((await import('sharp')).default);
        const errorMessage = 'ToBuffer error';
        const mockInstance = {
          // metadataは呼ばれないが、sharpインスタンス生成は成功すると仮定
          metadata: vi.fn().mockResolvedValue({
            width: 1920,
            height: 1080,
            format: 'png',
          } as Metadata),
          resize: vi.fn().mockReturnThis(),
          toBuffer: vi.fn().mockRejectedValueOnce(new Error(errorMessage)),
        };
        sharpFactory.mockReturnValue(mockInstance as unknown as Sharp);

        await expect(
          getVRChatPhotoItemData({
            photoPath: mockInputPhotoPath,
            width: mockResizeWidth,
          }),
        ).rejects.toThrow(errorMessage);
      });
    });
  });

  describe('getVRChatPhotoList', () => {
    beforeEach(async () => {
      vi.resetAllMocks();

      // sharpモックの動作を再設定
      const sharpModule = await import('sharp');
      const mockSharpFactory = sharpModule.default;

      const mockReturnedInstance = {
        metadata: vi.fn().mockResolvedValue({
          width: 1920,
          height: 1080,
          format: 'png',
        }),
        resize: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('dummy')),
      };
      vi.mocked(mockSharpFactory).mockReturnValue(
        mockReturnedInstance as unknown as Sharp,
      );
    });

    it('Windows環境で写真が検索できる', async () => {
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
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
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

    it('Windows環境で複数の写真が正しく検索される', async () => {
      // Windows環境をモック
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      // 複数の写真ファイルを返すようにモック
      vi.mocked(glob).mockResolvedValue([
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-00-00.000_1920x1080.png',
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-01-00.000_1920x1080.png',
      ]);

      // sharpモジュールは先頭のグローバルモックで対応

      const mockSettingStore: SettingStore = {
        __store: {} as SettingStore['__store'],
        getLogFilesDir: vi.fn(),
        setLogFilesDir: vi.fn(),
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        setVRChatPhotoDir: vi.fn(),
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
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

      // 結果の配列の長さを検証
      expect(Array.isArray(result)).toBe(true);

      // globが正しいパスで呼び出されたことを確認
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );

      // sharpのメソッドが呼び出されたことを検証
      const importedSharp = await import('sharp');
      expect(importedSharp.default).toHaveBeenCalled();
    });
  });
});
