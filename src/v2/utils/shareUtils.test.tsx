import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyImageToClipboard, downloadImageAsPng } from './shareUtils';

describe('shareUtils', () => {
  beforeEach(() => {
    // document.fontsのモック
    Object.defineProperty(document, 'fonts', {
      value: {
        load: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    // window.electronのモック
    Object.defineProperty(window, 'electron', {
      value: {
        electronUtil: {
          copyImageDataByBase64: vi.fn().mockResolvedValue(undefined),
        },
      },
      configurable: true,
    });
  });

  describe('copyImageToClipboard', () => {
    let mockCopyImageMutation: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // コピー関数のモック作成
      mockCopyImageMutation = vi.fn();
    });

    it('should generate valid SVG data', async () => {
      // 最小限のSVG要素を作成（2倍サイズ）
      const svgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      svgElement.setAttribute('viewBox', '0 0 1600 1200');
      svgElement.innerHTML = '<rect width="1600" height="1200" fill="white" />';

      // テスト実行
      await copyImageToClipboard(svgElement, mockCopyImageMutation);

      // copyImageMutationが有効なSVGデータで呼ばれたことを確認
      expect(mockCopyImageMutation).toHaveBeenCalled();
      const [svgData] = mockCopyImageMutation.mock.calls[0];

      // SVGデータが正しい形式であることを確認
      expect(svgData).toContain('<svg');
      expect(svgData).toContain('viewBox="0 0 1600 1200"');
      expect(svgData).toContain(
        '<rect width="1600" height="1200" fill="white"',
      );
      expect(svgData).toContain('</svg>');

      // フォントスタイルが含まれていることを確認
      expect(svgData).toContain('@import url');
      expect(svgData).toContain('Inter');
    });

    it('should handle null SVG element', async () => {
      await copyImageToClipboard(
        null as unknown as SVGSVGElement,
        mockCopyImageMutation,
      );
      expect(mockCopyImageMutation).not.toHaveBeenCalled();
    });
  });

  describe('downloadImageAsPng', () => {
    it('should call electronUtil.copyImageDataByBase64 with SVG data', async () => {
      // 最小限のSVG要素を作成
      const svgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      svgElement.setAttribute('viewBox', '0 0 800 600');
      svgElement.innerHTML = '<rect width="800" height="600" fill="white" />';

      // テスト実行
      await downloadImageAsPng({
        svgElement,
        worldName: 'test-world',
      });

      // electronUtil.copyImageDataByBase64が正しく呼ばれたことを確認
      expect(
        window.electron.electronUtil.copyImageDataByBase64,
      ).toHaveBeenCalled();
      const [params] = (
        window.electron.electronUtil.copyImageDataByBase64 as ReturnType<
          typeof vi.fn
        >
      ).mock.calls[0];

      // パラメータが正しいことを確認
      expect(params.filename).toBe('test-world.png');
      expect(params.svgData).toContain('<svg');
      expect(params.svgData).toContain('viewBox="0 0 800 600"');
    });

    it('should handle null SVG element', async () => {
      await downloadImageAsPng({
        svgElement: null as unknown as SVGSVGElement,
      });
      expect(
        window.electron.electronUtil.copyImageDataByBase64,
      ).not.toHaveBeenCalled();
    });

    it('should use default filename when worldName is not provided', async () => {
      const svgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      svgElement.setAttribute('viewBox', '0 0 800 600');

      await downloadImageAsPng({ svgElement });

      expect(
        window.electron.electronUtil.copyImageDataByBase64,
      ).toHaveBeenCalled();
      const [params] = (
        window.electron.electronUtil.copyImageDataByBase64 as ReturnType<
          typeof vi.fn
        >
      ).mock.calls[0];
      expect(params.filename).toBe('preview.png');
    });
  });
});
