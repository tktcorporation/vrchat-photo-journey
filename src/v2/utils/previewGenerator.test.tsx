import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePreviewPng } from './previewGenerator';

// XMLSerializerのモック
class MockXMLSerializer {
  serializeToString() {
    return '<svg>test</svg>';
  }
}
global.XMLSerializer = MockXMLSerializer as typeof XMLSerializer;

// DOMのモックを設定
const mockDocument = {
  createElement: vi.fn(),
  createElementNS: vi.fn(),
  fonts: {
    load: vi.fn().mockResolvedValue(undefined),
  },
};

// グローバルなdocumentオブジェクトをモック
global.document = mockDocument as unknown as Document;

// btoa関数のモック
global.btoa = vi.fn().mockReturnValue('test-base64');

// Image constructorのモック
class MockImage {
  onload = () => {};
  onerror = () => {};
  src = '';
  crossOrigin = '';

  constructor() {
    setTimeout(() => this.onload(), 0);
  }
}
global.Image = MockImage as unknown as typeof Image;

// URL.createObjectURLとrevokeObjectURLのモック
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('previewGenerator', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // 共通のキャンバスコンテキストのモック
    const mockCanvasContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray([
          255,
          0,
          0,
          255, // 赤ピクセル
          0,
          255,
          0,
          255, // 緑ピクセル
          0,
          0,
          255,
          255, // 青ピクセル
          // より多くのピクセルデータをシミュレート
          ...Array(1000)
            .fill(0)
            .flatMap(() => [
              Math.floor(Math.random() * 255),
              Math.floor(Math.random() * 255),
              Math.floor(Math.random() * 255),
              255,
            ]),
        ]),
        width: 800 * 2,
        height: 600 * 2,
      }),
    };

    // canvasのモック
    const mockCanvas = {
      width: 800 * 2,
      height: 600 * 2,
      getContext: vi.fn().mockReturnValue(mockCanvasContext),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test123'),
    };

    // createElementのモック実装
    mockDocument.createElement.mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return {} as HTMLElement;
    });

    // createElementNSのモック実装
    mockDocument.createElementNS.mockImplementation(
      (_namespace: string, tagName: string) => {
        if (tagName === 'svg') {
          return {
            setAttribute: vi.fn(),
            getAttribute: vi.fn().mockReturnValue('0 0 800 600'),
            insertBefore: vi.fn(),
            getElementsByTagName: vi.fn().mockReturnValue([]),
            cloneNode: vi.fn().mockReturnValue({
              setAttribute: vi.fn(),
              getAttribute: vi.fn().mockReturnValue('0 0 800 600'),
              insertBefore: vi.fn(),
              getElementsByTagName: vi.fn().mockReturnValue([]),
            }),
          };
        }
        if (tagName === 'style') {
          return {
            textContent: '',
          };
        }
        return {} as Element;
      },
    );
  });

  describe('generatePreviewPng', () => {
    it('プレビュー画像を正しく生成できること', async () => {
      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: [{ playerName: 'Player 1' }, { playerName: 'Player 2' }],
        showAllPlayers: false,
      };

      const result = await generatePreviewPng(params);

      // Base64エンコードされたPNG画像が返されること
      expect(result).toBe('test123');

      // フォントが読み込まれたことを確認
      expect(document.fonts.load).toHaveBeenCalledTimes(4);
      expect(document.fonts.load).toHaveBeenCalledWith('700 1em Inter');
      expect(document.fonts.load).toHaveBeenCalledWith('600 1em Inter');
      expect(document.fonts.load).toHaveBeenCalledWith('500 1em Inter');
      expect(document.fonts.load).toHaveBeenCalledWith('400 1em Inter');

      // BlobURLが作成され、解放されたことを確認
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('プレイヤーリストが空の場合も正しく処理できること', async () => {
      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: null,
        showAllPlayers: false,
      };

      const result = await generatePreviewPng(params);
      expect(result).toBe('test123');
    });

    it('showAllPlayersがtrueの場合、すべてのプレイヤーを表示できること', async () => {
      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: Array.from({ length: 20 }, (_, i) => ({
          playerName: `Player ${i + 1}`,
        })),
        showAllPlayers: true,
      };

      const result = await generatePreviewPng(params);
      expect(result).toBe('test123');
    });

    it('キャンバスコンテキストの取得に失敗した場合エラーを投げること', async () => {
      // キャンバスコンテキストの取得に失敗するようにモックを変更
      const mockCanvas = {
        width: 800 * 2,
        height: 600 * 2,
        getContext: vi.fn().mockReturnValue(null),
      };

      mockDocument.createElement.mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas;
        }
        return {} as HTMLElement;
      });

      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: null,
        showAllPlayers: false,
      };

      await expect(generatePreviewPng(params)).rejects.toThrow(
        'Failed to get canvas context',
      );
    });
  });
});
