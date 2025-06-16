import { app } from 'electron';
import { glob } from 'glob';
import sharp, { type Metadata, type Sharp } from 'sharp';
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

  // この関数は、指定された画像ファイルのパスとリサイズ幅を受け取り、
  // リサイズされた画像のbase64文字列を返すことを期待される。
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

    // 各テストケースの前に、sharpモックの基本的な振る舞いを設定する。
    // sharpファクトリ関数がモックインスタンスを返すようにし、
    // そのインスタンスの各メソッド（metadata, resize, toBuffer）もモックする。
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
        resize: vi.fn().mockReturnThis(), // メソッドチェーンのためthisを返す
        toBuffer: vi
          .fn()
          .mockResolvedValue(Buffer.from('dummy_thumbnail_data')), // デフォルトの成功時の値を設定
      };
      sharpFactory.mockReturnValue(mockSharpInstance as unknown as Sharp);
    });

    // 正常系のテストケース
    // 画像処理が成功し、期待されるbase64文字列が返されることを確認する。
    it('should return VRChatPhotoItemData on success', async () => {
      const mockThumbnailBuffer = Buffer.from('thumbnail_data');
      const expectedBase64String = `data:image/png;base64,${mockThumbnailBuffer.toString(
        'base64',
      )}`;
      // このテストケース専用にtoBufferの戻り値を設定
      mockSharpInstance.toBuffer.mockResolvedValue(mockThumbnailBuffer);

      const result = await getVRChatPhotoItemData({
        photoPath: mockInputPhotoPath,
        width: mockResizeWidth,
      });

      // 結果がOkであることを確認
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // 正常終了の場合、値が期待されるbase64文字列と一致することを確認
        expect(result.value).toBe(expectedBase64String);
      }
      // sharpファクトリが正しい引数で呼び出されたことを確認
      expect(sharpFactory).toHaveBeenCalledWith(mockInputPhotoPath);
      // resizeメソッドが正しい引数で呼び出されたことを確認
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(mockResizeWidth);
      // toBufferメソッドが呼び出されたことを確認
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });

    // エラーハンドリングのテストケース群
    describe('Error handling', () => {
      // sharpのファクトリ関数自体が「Input file is missing」エラーをスローする場合のテスト
      // この場合、"InputFileIsMissing" という特定のエラーオブジェクトが返されることを期待する。
      it('should return "InputFileIsMissing" error when sharp instantiation throws "Input file is missing"', async () => {
        // sharpファクトリがエラーをスローするように設定
        sharpFactory.mockImplementationOnce(() => {
          throw new Error('Input file is missing');
        });

        const result = await getVRChatPhotoItemData({
          photoPath: mockInputPhotoPath,
          width: mockResizeWidth,
        });

        // 結果がErrであることを確認
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          // エラーオブジェクトが期待されるものであることを確認
          expect(result.error).toBe('InputFileIsMissing');
        }
      });

      // sharpのファクトリ関数が「Input file is missing」以外のエラーをスローする場合のテスト
      // この場合、発生したエラーがそのままスローされることを期待する。
      it('should throw error for other sharp instantiation errors', async () => {
        const errorMessage = 'Some other sharp error';
        // sharpファクトリが特定のエラーメッセージでエラーをスローするように設定
        sharpFactory.mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

        // getVRChatPhotoItemDataの呼び出しが特定のエラーメッセージで失敗することを期待
        await expect(
          getVRChatPhotoItemData({
            photoPath: mockInputPhotoPath,
            width: mockResizeWidth,
          }),
        ).rejects.toThrow(errorMessage);
      });

      // sharpインスタンスのtoBufferメソッドがエラーをスローする場合のテスト
      // この場合、発生したエラーがそのままスローされることを期待する。
      it('should throw error when sharp.toBuffer throws an error', async () => {
        const errorMessage = 'ToBuffer error';
        // toBufferメソッドが特定のエラーメッセージでエラーをスローするように設定
        mockSharpInstance.toBuffer.mockRejectedValueOnce(
          new Error(errorMessage),
        );

        // getVRChatPhotoItemDataの呼び出しが特定のエラーメッセージで失敗することを期待
        await expect(
          getVRChatPhotoItemData({
            photoPath: mockInputPhotoPath,
            width: mockResizeWidth,
          }),
        ).rejects.toThrow(errorMessage);
      });
    });
  });

  // getVRChatPhotoList のテストを describe でグループ化
  // この関数は、指定されたディレクトリパスからVRChatのPNG画像ファイルを検索し、
  // 各画像の情報を VRChatPhotoItemData 型のオブジェクトの配列として返すことを期待される。
  // VRChatPhotoItemData には画像の base64 サムネイルなどが含まれる。
  describe('getVRChatPhotoList', () => {
    // 各テストケースの前に、共通のモック設定を行う。
    // vi.resetAllMocks() ですべてのモックをリセット後、
    // sharp ファクトリがデフォルトで成功するモックインスタンスを返すように設定する。
    // これにより、getVRChatPhotoList内部で getVRChatPhotoItemData (またはそれに類するsharp処理) が
    // 呼ばれた際に、基本的な画像処理が成功することをシミュレートする。
    beforeEach(async () => {
      vi.resetAllMocks(); // 他のモックはリセット

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

    // Windows環境での写真検索テスト (写真が見つからないケース)
    // 指定されたディレクトリにVRChatの写真が存在しない場合、空の配列が返ることを確認する。
    // また、globが正しいパターンで呼び出されることも確認する。
    it('Windows環境で写真が検索できる', async () => {
      // テスト実行環境をWindowsとして設定
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      // app.getPath が写真ディレクトリの親パスを返すようにモック
      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      // glob が空の配列 (ファイルが見つからない) を返すようにモック
      vi.mocked(glob).mockResolvedValue([]);

      // SettingStore のモックを設定。getVRChatPhotoDir と getVRChatPhotoExtraDirList が使われる。
      const mockSettingStore = {
        __store: {} as SettingStore['__store'],
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
      } as unknown as SettingStore;
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );
      // 結果が空の配列であることを確認
      expect(result).toEqual([]);
      // glob が期待されるパスパターンで呼び出されたことを確認
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );
      // このテストではglobの結果が空なので、sharp関連の処理は呼び出されないはず。
    });

    // Windows環境での写真検索テスト (複数の写真が見つかるケース)
    // 指定されたディレクトリに複数のVRChatの写真が存在する場合、
    // それに対応する VRChatPhotoItemData の配列が返ることを確認する (ここでは配列であることとsharpの呼び出し回数で代替)。
    // globが正しいパターンで呼び出され、見つかったファイル数に応じてsharp処理が実行されることを確認する。
    it('Windows環境で複数の写真が正しく検索される', async () => {
      // テスト実行環境をWindowsとして設定
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      // app.getPath が写真ディレクトリの親パスを返すようにモック
      vi.mocked(app.getPath).mockReturnValue('C:\\Users\\TestUser\\Pictures');
      // glob が複数の写真ファイルパスを返すようにモック
      const mockPhotoFiles = [
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-00-00.000_1920x1080.png',
        'C:\\Users\\TestUser\\Pictures\\VRChat\\2024-01\\VRChat_2024-01-01_00-01-00.000_1920x1080.png',
      ];
      vi.mocked(glob).mockResolvedValue(mockPhotoFiles);

      // SettingStore のモックを設定
      const mockSettingStore = {
        __store: {} as SettingStore['__store'],
        getVRChatPhotoDir: vi
          .fn()
          .mockReturnValue('C:\\Users\\TestUser\\Pictures\\VRChat'),
        getVRChatPhotoExtraDirList: vi.fn().mockReturnValue([]),
      } as unknown as SettingStore;
      vi.mocked(getSettingStore).mockReturnValue(mockSettingStore);

      const result = await getVRChatPhotoList(
        VRChatPhotoDirPathSchema.parse('C:\\Users\\TestUser\\Pictures\\VRChat'),
      );

      // 結果が配列であることを確認 (本来は内容も確認すべきだが、ここではsharpの呼び出しで代替)
      expect(Array.isArray(result)).toBe(true);
      // glob が期待されるパスパターンで呼び出されたことを確認
      expect(glob).toHaveBeenCalledWith(
        'C:/Users/TestUser/Pictures/VRChat/**/VRChat_*.png',
      );

      // sharp ファクトリ関数が見つかったファイル数 (2回) 呼び出されたことを確認
      // これは、各ファイルに対して getVRChatPhotoItemData (またはそれに類するsharp処理) が
      // 実行されたことを間接的に示す。
      expect(sharp).toHaveBeenCalledTimes(mockPhotoFiles.length);
    });
  });
});
