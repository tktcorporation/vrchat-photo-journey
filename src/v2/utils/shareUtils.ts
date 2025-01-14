interface ShareImageOptions {
  svgElement: SVGSVGElement;
  filenameExcludeExtension: string;
  downloadOrCopyMutation: {
    mutateAsync: (params: {
      pngBase64: string;
      filename: string;
    }) => Promise<void>;
  };
}

/**
 * SVG要素を画像として処理するための共通処理
 */
const processSvgElement = async (
  svgElement: SVGSVGElement,
): Promise<HTMLCanvasElement> => {
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

  // SVGをcanvasに描画
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
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

      // 背景を白に設定
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 画像を描画
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG'));
    };

    img.src = svgDataUrl;
  });
};

/**
 * 画像をPNGとしてダウンロードまたはクリップボードにコピーするための処理
 */
export const downloadOrCopyImageAsPng = async (
  options: ShareImageOptions,
): Promise<void> => {
  const { svgElement, filenameExcludeExtension, downloadOrCopyMutation } =
    options;
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  try {
    const canvas = await processSvgElement(clonedSvg);
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    await downloadOrCopyMutation.mutateAsync({
      pngBase64: base64,
      filename: `${filenameExcludeExtension || 'image'}.png`,
    });
  } catch (error) {
    console.error('Failed to convert to PNG:', error);
  }
};
