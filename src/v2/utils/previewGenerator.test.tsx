import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generatePreviewPng, generatePreviewSvg } from './previewGenerator.tsx';

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
    load: vi.fn().mockResolvedValue(undefined), // This mock might be irrelevant now but kept for safety
  },
};
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
    setTimeout(() => this.onload(), 0); // Simulate async loading
  }
}
global.Image = MockImage as unknown as typeof Image;

// URL.createObjectURLとrevokeObjectURLのモック
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('previewGenerator', () => {
  let fontDataGlobal: ArrayBuffer;

  beforeAll(() => {
    // Load the actual font file once for all tests
    const fontPath = path.resolve(process.cwd(), 'assets/NotoSansCJKjp-Regular.ttf');
    const nodeBuffer = fs.readFileSync(fontPath);
    fontDataGlobal = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
  });

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // 共通のキャンバスコンテキストのモック (for extractDominantColors and PNG generation)
    const mockCanvasContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray([
          255,0,0,255, 0,255,0,255, 0,0,255,255, // Some basic pixels
          ...Array(1000).fill(0).flatMap(() => [
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            255,
          ]),
        ]),
        width: 10, // Simplified dimensions for mock image data
        height: 10,
      }),
    };

    const mockCanvas = {
      width: 800 * 2, // For PNG generation
      height: 600 * 2, // For PNG generation
      getContext: vi.fn().mockImplementation((contextType: string) => {
        if (contextType === '2d') {
          // Mock for extractDominantColors if it needs different dimensions
          if (mockCanvas.width !== 800*2 || mockCanvas.height !== 600*2) {
             return {
                ...mockCanvasContext,
                getImageData: vi.fn().mockReturnValue({
                    data: new Uint8ClampedArray(mockCanvas.width * mockCanvas.height * 4),
                    width: mockCanvas.width,
                    height: mockCanvas.height,
                }),
             };
          }
          return mockCanvasContext;
        }
        return null;
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test123'),
    };

    // Mock for Image used in extractDominantColors
    const mockImageInstance = {
        onload: () => {},
        onerror: () => {},
        src: '',
        crossOrigin: '',
        width: 32, // example width for mock image in extractDominantColors
        height: 32, // example height
    };

    global.Image = vi.fn(() => {
        // Simulate async loading for the image in extractDominantColors
        setTimeout(() => mockImageInstance.onload(), 0);
        return mockImageInstance;
    }) as any;


    mockDocument.createElement.mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        // This will be called by extractDominantColors AND generatePreviewPng
        // We need to differentiate or ensure the mock is flexible.
        // For extractDominantColors, canvas width/height are set from image.
        // For generatePreviewPng, they are 800*2, 600*2.
        const newMockCanvas = { ...mockCanvas };
        // Allow width/height to be set on this instance by extractDominantColors
        Object.defineProperty(newMockCanvas, 'width', { writable: true, value: 0 });
        Object.defineProperty(newMockCanvas, 'height', { writable: true, value: 0 });
        return newMockCanvas;
      }
      return {} as HTMLElement;
    });

    // No need to mock createElementNS for this test anymore as Satori generates SVG string directly
  });

  describe('generatePreviewPng', () => {
    it('プレビュー画像を正しく生成できること', async () => {
      const params = {
        worldName: 'Test World PNG',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Valid 1x1 PNG
        players: [{ playerName: 'Player 1' }, { playerName: 'Player 2' }],
        showAllPlayers: false,
        fontData: fontDataGlobal,
      };
      const result = await generatePreviewPng(params);
      expect(result).toBe('test123');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('プレイヤーリストが空の場合も正しく処理できること', async () => {
      const params = {
        worldName: 'Test World PNG Empty',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        players: null,
        showAllPlayers: false,
        fontData: fontDataGlobal,
      };
      const result = await generatePreviewPng(params);
      expect(result).toBe('test123');
    });

    it('showAllPlayersがtrueの場合、すべてのプレイヤーを表示できること', async () => {
      const params = {
        worldName: 'Test World PNG All Players',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        players: Array.from({ length: 20 }, (_, i) => ({ playerName: `Player ${i + 1}` })),
        showAllPlayers: true,
        fontData: fontDataGlobal,
      };
      const result = await generatePreviewPng(params);
      expect(result).toBe('test123');
    });

    it('キャンバスコンテキストの取得に失敗した場合エラーを投げること', async () => {
      mockDocument.createElement.mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            width: 800*2,
            height: 600*2,
            getContext: vi.fn().mockReturnValue(null), // Fail context creation
            toDataURL: vi.fn(),
          };
        }
        return {} as HTMLElement;
      });
      const params = {
        worldName: 'Test World PNG Error',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        players: null,
        showAllPlayers: false,
        fontData: fontDataGlobal,
      };
      await expect(generatePreviewPng(params)).rejects.toThrow('Failed to get canvas context');
    });
  });

  describe('generatePreviewSvg', () => {
    // Satori mock is removed. Actual Satori will be used with embedFont: false.
    // fontDataGlobal is loaded in beforeAll and available.

    it('should return SVG string and height, and match snapshot with actual Satori', async () => {
      const params = {
        worldName: 'Test SVG World',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Valid 1x1 transparent PNG
        players: [{ playerName: 'SVG Player 1' }],
        showAllPlayers: false,
        fontData: fontDataGlobal, // Use the actual loaded font data
      };
      const result = await generatePreviewSvg(params);
      expect(typeof result.svg).toBe('string');
      // No longer comparing to a fixed mock SVG string.
      expect(result.svg).toMatchSnapshot(); // Snapshot the actual SVG output from Satori
      expect(typeof result.height).toBe('number');
      expect(result.height).toBeGreaterThanOrEqual(600);
    });
  });
});
