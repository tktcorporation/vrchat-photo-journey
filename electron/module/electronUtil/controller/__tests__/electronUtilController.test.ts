import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import type { inferProcedureInput } from '@trpc/server';
import { dialog } from 'electron';
import * as path from 'pathe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { electronUtilRouter } from '../electronUtilController';

vi.mock('node:fs/promises');
vi.mock('electron-is-dev', () => ({ default: false }));
vi.mock('electron', () => ({
  clipboard: {
    writeText: vi.fn(),
    writeImage: vi.fn(),
  },
  nativeImage: {
    createFromPath: vi.fn(),
    createFromBuffer: vi.fn(),
  },
  dialog: {
    showSaveDialog: vi.fn(),
  },
}));

describe('electronUtilController', () => {
  const router = electronUtilRouter();

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.mkdtemp as jest.Mock).mockResolvedValue(
      path.join(os.tmpdir(), 'test-dir'),
    );
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.copyFile as jest.Mock).mockResolvedValue(undefined);
    (fs.rm as jest.Mock).mockResolvedValue(undefined);
  });

  describe('downloadImageAsPng', () => {
    it('should download image as png', async () => {
      const mockPath = path.join(os.homedir(), 'Downloads', 'test.png');
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePath: mockPath,
      });

      const resolver = router.downloadImageAsPng._def.resolver as (opts: {
        ctx: Record<string, unknown>;
        input: inferProcedureInput<typeof router.downloadImageAsPng>;
      }) => Promise<void>;

      await resolver({
        ctx: {},
        input: {
          pngBase64: 'test-base64',
          filenameWithoutExt: 'test',
        },
      });

      const expectedTempPath = path.join(os.tmpdir(), 'test-dir', 'test.png');

      // 一時ファイルの作成を確認
      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedTempPath,
        expect.any(Uint8Array),
      );

      // 一時ファイルから保存先へのコピーを確認
      expect(fs.copyFile).toHaveBeenCalledWith(expectedTempPath, mockPath);

      // 一時ディレクトリの削除を確認
      expect(fs.rm).toHaveBeenCalledWith(path.join(os.tmpdir(), 'test-dir'), {
        recursive: true,
        force: true,
      });
    });

    it('should handle dialog cancel', async () => {
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const resolver = router.downloadImageAsPng._def.resolver as (opts: {
        ctx: Record<string, unknown>;
        input: inferProcedureInput<typeof router.downloadImageAsPng>;
      }) => Promise<void>;

      await resolver({
        ctx: {},
        input: {
          pngBase64: 'test-base64',
          filenameWithoutExt: 'test',
        },
      });

      // 一時ファイルの作成は行われる
      expect(fs.writeFile).toHaveBeenCalled();
      // コピーは行われない
      expect(fs.copyFile).not.toHaveBeenCalled();
      // 一時ディレクトリは削除される
      expect(fs.rm).toHaveBeenCalledWith(path.join(os.tmpdir(), 'test-dir'), {
        recursive: true,
        force: true,
      });
    });

    it('should handle write error', async () => {
      const mockPath = path.join(os.homedir(), 'Downloads', 'test.png');
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePath: mockPath,
      });
      const mockError = new Error('Write error');
      (fs.copyFile as jest.Mock).mockRejectedValue(mockError);

      const resolver = router.downloadImageAsPng._def.resolver as (opts: {
        ctx: Record<string, unknown>;
        input: inferProcedureInput<typeof router.downloadImageAsPng>;
      }) => Promise<void>;

      await expect(
        resolver({
          ctx: {},
          input: {
            pngBase64: 'test-base64',
            filenameWithoutExt: 'test',
          },
        }),
      ).rejects.toThrow('Failed to handle png file');

      // エラー後も一時ディレクトリは削除される
      expect(fs.rm).toHaveBeenCalledWith(path.join(os.tmpdir(), 'test-dir'), {
        recursive: true,
        force: true,
      });
    });
  });
});
