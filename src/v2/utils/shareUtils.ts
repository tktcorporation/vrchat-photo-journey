import { loadInterFonts } from './fontLoader';

interface ShareImageOptions {
  pngBase64: string;
  filenameWithoutExt: string;
  downloadOrCopyMutation: {
    mutateAsync: (params: {
      pngBase64: string;
      filenameWithoutExt: string;
    }) => Promise<void>;
  };
}

/**
 * SVG要素を画像として処理するための共通処理
 */
const _processSvgElement = async (
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
  await loadInterFonts();

  // SVGをcanvasに描画
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const { width, height } = extractSvgWidthAndHeight(svgElement);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
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
 * SVGの縦横幅を抽出する
 */
const extractSvgWidthAndHeight = (
  svgElement: SVGSVGElement,
): { width: number; height: number } => {
  const viewBox = svgElement.getAttribute('viewBox');
  if (!viewBox) return { width: 800, height: 600 };

  const [, , width, height] = viewBox.split(' ').map(Number);
  return { width: width || 800, height: height || 600 };
};

/**
 * 画像をPNGとしてダウンロードまたはクリップボードにコピーするための処理
 */
export const downloadOrCopyImageAsPng = async ({
  pngBase64,
  filenameWithoutExt,
  downloadOrCopyMutation,
}: ShareImageOptions): Promise<void> => {
  if (!pngBase64) {
    console.error('Failed to convert to PNG:', 'No PNG base64 data');
    throw new Error('Failed to convert to PNG');
  }

  try {
    await downloadOrCopyMutation.mutateAsync({
      pngBase64,
      filenameWithoutExt,
    });
  } catch (error) {
    console.error('Failed to convert to PNG:', error);
    throw new Error('Failed to convert to PNG');
  }
};
