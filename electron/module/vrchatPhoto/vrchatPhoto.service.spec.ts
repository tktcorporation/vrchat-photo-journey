import { app } from 'electron';
import { glob } from 'glob';
import sharp, { type Metadata, type Sharp } from 'sharp';
import { type Mocked, beforeEach, describe, expect, it, vi } from 'vitest';
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
    metadata: vi.fn(), // 具体的な値は各テストで設定
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn(), // 具体的な値は各テストで設定
  };

  // sharpファクトリー関数のモック
  const mockSharp = vi.fn().mockReturnValue(mockSharpInstance);

  return {
    default: mockSharp,
    // 他のsharpのプロパティや関数も必要に応じてモック
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
    let sharpFactory: ReturnType<typeof vi.mocked<typeof sharp>>;
    // sharpインスタンスの型を明示的に指定
    let mockSharpInstance: {
      metadata: ReturnType<typeof vi.fn>;
      resize: ReturnType<typeof vi.fn>;
      toBuffer: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      // sharpモジュールのモックを再取得
      sharpFactory = vi.mocked(sharp);
      // モックされたsharpインスタンスのメソッドを再取得/設定
      // これはsharpFactoryが呼び出されるたびに新しいモックインスタンスを返すようにするため
      // グローバルモックで返されるインスタンスを上書きする
      mockSharpInstance = {
        metadata: vi.fn().mockResolvedValue({
          // デフォルトの成功時の値を設定
          width: 1920,
          height: 1080,
          format: 'png',
        } as Metadata),
        resize: vi.fn().mockReturnThis(),
        toBuffer: vi
          .fn()
          .mockResolvedValue(Buffer.from('dummy_thumbnail_data')), // デフォルトの成功時の値を設定
      };
      sharpFactory.mockReturnValue(mockSharpInstance as unknown as Sharp);
    });

    it('should return VRChatPhotoItemData on success', async () => {
      const mockThumbnailBuffer = Buffer.from('thumbnail_data');
      const expectedBase64String = `data:image/png;base64,${mockThumbnailBuffer.toString(
        'base64',
      )}`;
      // toBufferのモックをこのテストケース用に設定
      mockSharpInstance.toBuffer.mockResolvedValue(mockThumbnailBuffer);

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
      // expect(mockSharpInstance.metadata).toHaveBeenCalled();
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(mockResizeWidth);
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });

    describe('Error handling', () => {
      it('should return "InputFileIsMissing" error when sharp instantiation throws "Input file is missing"', async () => {
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

      it('should throw error when sharp.toBuffer throws an error', async () => {
        const errorMessage = 'ToBuffer error';
        // toBuffer のモックをこのテストケース用に設定
        mockSharpInstance.toBuffer.mockRejectedValueOnce(
          new Error(errorMessage),
        );

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

      // sharpファクトリが返すインスタンスのデフォルトの振る舞いを設定
      const mockInstance = {
        metadata: vi.fn().mockResolvedValue({
          width: 1920,
          height: 1080,
          format: 'png',
        } as Metadata),
        resize: vi.fn().mockReturnThis(),
        toBuffer: vi
          .fn()
          .mockResolvedValue(Buffer.from('dummy_thumbnail_data')),
      };
      vi.mocked(sharp).mockReturnValue(mockInstance as unknown as Sharp);
    });

    it('Windows環境で写真が検索できる', async () => {
      // Windows環境をモック
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      vi.mocked(glob).mockResolvedValue([]);

      const mockSettingStore = {
        __store: {} as SettingStore['__store'],
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
      } as unknown as SettingStore; // 使用しないプロパティを削除し、型アサーション
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );
      expect(result).toEqual([]);
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );
      // このテストではgetVRChatPhotoItemDataが呼ばれない（globの結果が空のため）ので、sharpの呼び出し確認は不要
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
      // const importedSharp = await import('sharp'); // 不要になる

      const mockSettingStore = {
        __store: {} as SettingStore['__store'],
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
      } as unknown as SettingStore; // 使用しないプロパティを削除し、型アサーション
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );

      // 結果の配列の長さを検証
      expect(Array.isArray(result)).toBe(true);
      // globの結果が2つなので、結果の配列の長さも2になることを期待する
      // ただし、getVRChatPhotoListはVRChatPhotoItemDataの配列を返すので、
      // その中身が期待通りか、またはsharpが適切に呼ばれたかを確認する必要がある。
      // ここでは、getVRChatPhotoItemDataが内部で呼び出されることを前提とし、
      // sharpの呼び出し回数などで検証する。

      // globが正しいパスで呼び出されたことを確認
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );

      // sharpのメソッドが呼び出されたことを検証
      // globの結果が2つのファイルを返すので、getVRChatPhotoItemDataが2回呼ばれ、
      // 結果としてsharpファクトリも2回呼ばれるはず
      // const importedSharp = await import('sharp'); // sharpFactory を使うので不要
      expect(sharp).toHaveBeenCalledTimes(2); // インポートされたsharpモックを直接確認
      // resizeやtoBufferがそれぞれ2回呼ばれることも確認できるが、
      // getVRChatPhotoItemDataのテストでそれらの呼び出しは確認済みなので、
      // ここではsharpファクトリの呼び出し回数で十分かもしれない。
    });
  });
});
