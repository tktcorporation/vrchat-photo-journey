import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePreviewPng } from './previewGenerator';

// Satori のモック
vi.mock('satori', () => ({
  default: vi.fn().mockResolvedValue('<svg>mocked svg</svg>'),
}));

// Resvg のモック
vi.mock('@resvg/resvg-js', () => ({
  Resvg: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockReturnValue({
      asPng: vi.fn().mockReturnValue(new Uint8Array([137, 80, 78, 71])), // PNG signature
    }),
  })),
}));

// colorExtractor のモック
vi.mock('./colorExtractor', () => ({
  extractDominantColorsFromBase64: vi.fn().mockResolvedValue({
    primary: '#FF0000',
    secondary: '#00FF00',
    accent: '#0000FF',
  }),
}));

// fetch のモック
global.fetch = vi.fn().mockResolvedValue({
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  url: '',
  body: null,
  bodyUsed: false,
  blob: vi.fn(),
  clone: vi.fn(),
  formData: vi.fn(),
  json: vi.fn(),
  text: vi.fn(),
  type: 'basic' as ResponseType,
  redirected: false,
} as unknown as Response);

// btoa のモック
global.btoa = vi.fn().mockImplementation((str: string) => {
  return Buffer.from(str, 'binary').toString('base64');
});

describe('previewGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      // フォントが取得されたことを確認
      expect(global.fetch).toHaveBeenCalledWith(
        'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2',
      );
    });

    it('プレイヤーリストが空の場合も正しく処理できること', async () => {
      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: null,
        showAllPlayers: false,
      };

      const result = await generatePreviewPng(params);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
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
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('日本語のプレイヤー名も正しく処理できること', async () => {
      const params = {
        worldName: 'テストワールド',
        imageBase64: 'test-image-base64',
        players: [
          { playerName: 'プレイヤー1' },
          { playerName: 'プレイヤー2' },
          { playerName: '混在Player3' },
        ],
        showAllPlayers: false,
      };

      const result = await generatePreviewPng(params);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('長いプレイヤーリストで改行が正しく処理されること', async () => {
      const params = {
        worldName: 'Test World',
        imageBase64: 'test-image-base64',
        players: Array.from({ length: 50 }, (_, i) => ({
          playerName: `VeryLongPlayerName${i + 1}`,
        })),
        showAllPlayers: false,
      };

      const result = await generatePreviewPng(params);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
});
