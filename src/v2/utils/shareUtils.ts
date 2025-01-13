import type { SVGProps } from 'react';

declare global {
  interface Window {
    electron: {
      electronUtil: {
        copyImageDataByBase64: (params: {
          svgData: string;
          filename?: string;
        }) => Promise<void>;
      };
    };
  }
}

interface ShareImageOptions {
  svgElement: SVGSVGElement;
  worldName?: string | null;
}

/**
 * SVG要素を画像として処理するための共通処理
 */
const processSvgElement = async (
  svgElement: SVGSVGElement,
): Promise<string> => {
  // インラインスタイルを追加
  const styleElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'style',
  );
  styleElement.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    text, div {
      font-family: 'Inter', sans-serif;
    }
    foreignObject div {
      font-family: 'Inter', sans-serif !important;
    }
  `;
  svgElement.insertBefore(styleElement, svgElement.firstChild);

  // foreignObject内のdivにもフォントを直接設定
  const foreignDivs = svgElement.getElementsByTagName('div');
  for (const div of foreignDivs) {
    div.style.fontFamily = 'Inter, sans-serif';
  }

  // フォントを読み込む
  await document.fonts.load('700 1em Inter');
  await document.fonts.load('600 1em Inter');
  await document.fonts.load('500 1em Inter');
  await document.fonts.load('400 1em Inter');

  // SVGをシリアライズ
  const svgData = new XMLSerializer().serializeToString(svgElement);
  return svgData;
};

/**
 * 画像をクリップボードにコピーするための処理
 */
export const copyImageToClipboard = async (
  svgElement: SVGSVGElement,
  copyImageMutation: (svgData: string, filename?: string) => void,
  filename?: string,
): Promise<void> => {
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  const svgData = await processSvgElement(clonedSvg);
  copyImageMutation(svgData, filename);
};

/**
 * 画像をPNGとしてダウンロードするための処理
 */
export const downloadImageAsPng = async (
  options: ShareImageOptions,
): Promise<void> => {
  const { svgElement, worldName } = options;
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  const svgData = await processSvgElement(clonedSvg);

  // バックエンドのAPIを呼び出してPNGデータを取得
  await window.electron.electronUtil.copyImageDataByBase64({
    svgData,
    filename: `${worldName || 'preview'}.png`,
  });
};
