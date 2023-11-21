import sharp from "sharp";
import { generateTextPath } from "./lib";

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
		description: string;
	};
}

const createOGPImage = async ({ worldName, date, exif }: Props) => {
	const title = worldName;

	// SVGを生成
	const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${1200}" height="${630}">
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
				align: "center",
				color: "#555",
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
					align: "right",
					color: "#ccc",
					lines: 1,
				},
			)} </g> `
		}
  </svg>`;

	// sharp: SVG画像をPNG画像に変換
	return sharp(Buffer.from(svg))
		.png()
		.withMetadata({
			exif: {
				IFD0: {
					// タイトル
					ImageDescription: exif.description,
					// 撮影日
					DateTimeOriginal: exif.dateTimeOriginal
						.toISOString()
						.replace(/:/g, "-"),
				},
			},
		})
		.toBuffer();
};

export { createOGPImage };
