import type { SVGProps } from 'react';

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

  // SVGをデータURLに変換
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // フォントを読み込む
  await document.fonts.load('700 1em Inter');
  await document.fonts.load('600 1em Inter');
  await document.fonts.load('500 1em Inter');
  await document.fonts.load('400 1em Inter');

  return svgDataUrl;
};

/**
 * SVGを画像として処理し、指定されたコールバックを実行する
 */
const processImage = async (
  svgDataUrl: string,
  callback: (canvas: HTMLCanvasElement) => void,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800 * 2;
      canvas.height = 600 * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 背景を透明に
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 画像を描画
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        callback(canvas);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG'));
    };

    img.src = svgDataUrl;
  });
};

/**
 * 画像をクリップボードにコピーするための処理
 */
export const copyImageToClipboard = async (
  svgElement: SVGSVGElement,
  copyImageMutation: (base64: string) => void,
): Promise<void> => {
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  const svgDataUrl = await processSvgElement(clonedSvg);

  return processImage(svgDataUrl, (canvas) => {
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    copyImageMutation(base64);
  }).catch((error) => {
    console.error('Failed to copy to clipboard:', error);
  });
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
  const svgDataUrl = await processSvgElement(clonedSvg);

  return processImage(svgDataUrl, (canvas) => {
    const pngDataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${worldName || 'preview'}.png`;
    link.href = pngDataUrl;
    link.click();
  }).catch((error) => {
    console.error('Failed to convert to PNG:', error);
  });
};
