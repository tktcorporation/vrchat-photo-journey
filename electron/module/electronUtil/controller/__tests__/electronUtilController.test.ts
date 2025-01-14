import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { dialog } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { electronUtilRouter } from '../electronUtilController';

vi.mock('node:fs/promises');
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

  describe('downloadImageAsSvg', () => {
    it('should handle SVG with existing style attributes', async () => {
      const svgData = `
        <svg style="opacity: 0.8;" viewBox="0 0 800 600">
          <foreignObject style="overflow: hidden;" x="0" y="0" width="800" height="600">
            <div>Test Content</div>
          </foreignObject>
        </svg>
      `;

      // モックの設定
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        filePath: '/test/path/image.png',
        canceled: false,
      });
      vi.mocked(fs.mkdtemp).mockResolvedValue('/tmp/test-dir');
      vi.mocked(fs.copyFile).mockResolvedValue();
      vi.mocked(fs.rm).mockResolvedValue();

      // テスト実行
      await router.downloadImageAsSvg.mutation({
        svgData,
        filename: 'test.png',
      });

      // 一時ディレクトリが作成されたことを確認
      expect(fs.mkdtemp).toHaveBeenCalled();

      // ファイルがコピーされたことを確認
      expect(fs.copyFile).toHaveBeenCalled();

      // 一時ディレクトリが削除されたことを確認
      expect(fs.rm).toHaveBeenCalled();
    });

    it('should handle SVG without style attributes', async () => {
      const svgData = `
        <svg viewBox="0 0 800 600">
          <foreignObject x="0" y="0" width="800" height="600">
            <div>Test Content</div>
          </foreignObject>
        </svg>
      `;

      // モックの設定
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        filePath: '/test/path/image.png',
        canceled: false,
      });
      vi.mocked(fs.mkdtemp).mockResolvedValue('/tmp/test-dir');
      vi.mocked(fs.copyFile).mockResolvedValue();
      vi.mocked(fs.rm).mockResolvedValue();

      // テスト実行
      await router.downloadImageAsSvg.mutation({
        svgData,
        filename: 'test.png',
      });

      // 一時ディレクトリが作成されたことを確認
      expect(fs.mkdtemp).toHaveBeenCalled();

      // ファイルがコピーされたことを確認
      expect(fs.copyFile).toHaveBeenCalled();

      // 一時ディレクトリが削除されたことを確認
      expect(fs.rm).toHaveBeenCalled();
    });

    it('should handle dialog cancellation', async () => {
      const svgData = `
        <svg viewBox="0 0 800 600">
          <rect width="800" height="600" fill="white" />
        </svg>
      `;

      // キャンセルされた場合のモック
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });
      vi.mocked(fs.mkdtemp).mockResolvedValue('/tmp/test-dir');
      vi.mocked(fs.rm).mockResolvedValue();

      // テスト実行
      await router.downloadImageAsSvg.mutation({
        svgData,
        filename: 'test.png',
      });

      // 一時ディレクトリが作成されたことを確認
      expect(fs.mkdtemp).toHaveBeenCalled();

      // ファイルがコピーされていないことを確認
      expect(fs.copyFile).not.toHaveBeenCalled();

      // 一時ディレクトリが削除されたことを確認
      expect(fs.rm).toHaveBeenCalled();
    });
  });
});
