import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadOrCopyImageAsPng } from './shareUtils';

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

describe('shareUtils', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // canvasのモック
    const mockCanvas = {
      width: 800 * 2,
      height: 600 * 2,
      getContext: vi.fn().mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }),
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

  describe('downloadOrCopyImageAsPng', () => {
    it('should process SVG element correctly', async () => {
      const copyImageMutation = vi.fn().mockResolvedValue(undefined);

      // 関数を実行
      await downloadOrCopyImageAsPng({
        pngBase64: 'test-base64',
        filenameExcludeExtension: 'test',
        downloadOrCopyMutation: {
          mutateAsync: copyImageMutation,
        },
      });

      // copyImageMutationが正しく呼ばれたか確認
      expect(copyImageMutation).toHaveBeenCalledWith({
        filename: 'test.png',
        pngBase64: 'test-base64',
      });
    });

    it('should handle null SVG element', async () => {
      const copyImageMutation = vi.fn().mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'error');

      try {
        await downloadOrCopyImageAsPng({
          pngBase64: undefined as unknown as string,
          filenameExcludeExtension: 'test',
          downloadOrCopyMutation: {
            mutateAsync: copyImageMutation,
          },
        });
      } catch (_error) {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to convert to PNG:',
          expect.any(Error),
        );
      }
    });

    it('should handle mutation error', async () => {
      const error = new Error('Failed to copy image');
      const copyImageMutation = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await downloadOrCopyImageAsPng({
        pngBase64: 'test-base64',
        filenameExcludeExtension: 'test',
        downloadOrCopyMutation: {
          mutateAsync: copyImageMutation,
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to convert to PNG:',
        error,
      );
    });
  });
});
