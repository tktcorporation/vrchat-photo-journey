import * as datefns from 'date-fns';
import sharp from 'sharp';
import { generateTextPath } from './lib';

interface Props {
  worldName: string;
  date: {
    year: number;
    month: number;
    day: number;
  };
  exif: {
    // 撮影日
    dateTimeOriginal: Date;
  };
  imageWidth?: number;
}

/**
 * OGP画像のbufferを生成
 * ファイルの作成までは行わない
 */
const generateOGPImageBuffer = async ({
  worldName,
  date,
  exif,
  imageWidth,
}: Props): Promise<Buffer> => {
  const title = worldName;
  // 縦横比率
  const aspectRatio = 1200 / 630;
  const imageHeight = imageWidth ? imageWidth / aspectRatio : undefined;

  // SVGを生成
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${
    imageWidth ?? 1200
  }" height="${imageHeight ?? 630}" viewBox="0 0 1200 630">
    <!-- フィルター定義 -->
    <defs>
      <!-- 影フィルター -->
      <filter id="filter1" x="-0.0164" y="-0.0312">
        <feFlood flood-opacity="0.1" flood-color="rgb(0,0,0)" result="flood" />
        <feComposite in="flood" in2="SourceGraphic" operator="in" result="composite1" />
        <feGaussianBlur in="composite1" stdDeviation="4.1" result="blur" />
        <feOffset dx="2.4" dy="2.4" result="offset" />
        <feComposite in="SourceGraphic" in2="offset" operator="over" result="composite2" />
      </filter>
    </defs>

    <!-- 背景 (灰色) -->
    <rect style="fill:#E9E9E9;" width="100%" height="100%" />

    <!-- 四角角丸 (水色) -->
    <rect
      style="fill:#F6FAFD;"
      width="1130"
      height="560"
      x="35.0"
      y="35.0"
      ry="35.0"
      filter="url(#filter1)" />
    
    <!-- 指定した文字列をSVGパスに変換 -->
    <g transform="translate(70, 70)">
      ${generateTextPath(title, 1060, 80, {
        align: 'center',
        color: '#555',
        lines: 4,
      })}
    </g>
    
    <!-- ユーザー名をSVGパスに変換 -->
    ${
      date &&
      `<g transform="translate(70, 470)"> ${generateTextPath(
        `${date.year}-${date.month}-${date.day}`,
        1060,
        64,
        {
          align: 'right',
          color: '#ccc',
          lines: 1,
        },
      )} </g> `
    }
  </svg>`;

  // sharp: SVG画像をJPEG画像に変換
  let file = sharp(Buffer.from(svg))
    .jpeg()
    // exif に撮影日のデータを記録
    .withMetadata({
      exif: {
        IFD0: {
          DateTime: datefns.format(
            exif.dateTimeOriginal,
            'yyyy-MM-dd HH:mm:ss',
          ),
          DateTimeDigitized: datefns.format(
            exif.dateTimeOriginal,
            'yyyy-MM-dd HH:mm:ss',
          ),
          DateTimeOriginal: datefns.format(
            exif.dateTimeOriginal,
            'yyyy-MM-dd HH:mm:ss',
          ),
          ImageDescription: worldName,
        },
      },
    });
  if (imageWidth) {
    file = file.resize(imageWidth);
  }
  return file.toBuffer();
};

export { generateOGPImageBuffer };
