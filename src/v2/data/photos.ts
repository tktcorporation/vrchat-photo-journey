import type { Photo } from '../types/photo';

const locations = [
  {
    name: '浅草寺',
    prefecture: '東京都',
    country: '日本',
    description:
      '東京都台東区浅草にある聖観音宗の仏教寺院。都内最古の寺院で、雷門と仲見世通りで知られる観光名所。',
    coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
    visitedWith: ['家族', '友人'],
  },
  {
    name: '富士山',
    prefecture: '山梨県',
    country: '日本',
    description:
      '日本最高峰の山。世界文化遺産に登録された日本の象徴的な名所。四季折々の美しい景色を楽しめる。',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    visitedWith: ['写真サークル', '同僚'],
  },
  {
    name: '清水寺',
    prefecture: '京都府',
    country: '日本',
    description:
      '京都を代表する寺院。舞台造りの本堂と美しい庭園で知られ、桜や紅葉の名所としても人気。',
    coverImage: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    visitedWith: ['友人'],
  },
  {
    name: '宮島',
    prefecture: '広島県',
    country: '日本',
    description:
      '世界遺産の厳島神社がある島。海に浮かぶ大鳥居と美しい自然景観で知られる。',
    coverImage: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d',
    visitedWith: ['カメラ部', '家族'],
  },
];

// 様々なアスペクト比と解像度を持つ画像セット
const imageVariants = [
  // 超ワイド パノラマ (21:9)
  {
    width: 2520,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    description: 'パノラマ風景',
  },
  // 標準的なワイド (16:9)
  {
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7',
    description: 'HD風景写真',
  },
  // 映画的アスペクト比 (2.39:1)
  {
    width: 2390,
    height: 1000,
    url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc',
    description: 'シネマスコープ',
  },
  // 標準的な写真 (3:2)
  {
    width: 1800,
    height: 1200,
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    description: 'デジタル一眼標準',
  },
  // 正方形 (1:1)
  {
    width: 1500,
    height: 1500,
    url: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36',
    description: 'SNS向け正方形',
  },
  // 縦長写真 (2:3)
  {
    width: 1200,
    height: 1800,
    url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    description: '縦位置ポートレート',
  },
  // スマートフォン縦撮り (9:16)
  {
    width: 1080,
    height: 1920,
    url: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d',
    description: 'スマホ縦撮り',
  },
  // 超縦長 (1:3)
  {
    width: 800,
    height: 2400,
    url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716',
    description: '超縦長建築写真',
  },
  // 4:3 比率
  {
    width: 1600,
    height: 1200,
    url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
    description: 'クラシック比率',
  },
  // 5:4 比率
  {
    width: 1500,
    height: 1200,
    url: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded',
    description: '中判カメラ比率',
  },
];

// 異なる解像度バリエーションを生成
const resolutionVariants = imageVariants.flatMap((variant) => {
  const scales = [1, 1.5, 0.75]; // 元のサイズ、1.5倍、0.75倍
  return scales.map((scale) => ({
    ...variant,
    width: Math.round(variant.width * scale),
    height: Math.round(variant.height * scale),
    url: `${variant.url}?w=${Math.round(variant.width * scale)}`,
  }));
});

export const generatePhotos = (): Photo[] => {
  const categories = [
    { season: '春', items: ['桜', '菜の花', '新緑'] },
    { season: '夏', items: ['海', '花火', '夕焼け'] },
    { season: '秋', items: ['紅葉', '秋空', '稲穂'] },
    { season: '冬', items: ['雪景色', '冬空', '氷'] },
  ];

  const photos: Photo[] = [];
  const startDate = new Date(2023, 0, 1);

  for (let i = 0; i < 200; i++) {
    const categoryIndex = i % categories.length;
    const category = categories[categoryIndex];
    const locationIndex = i % locations.length;
    const imageVariant = resolutionVariants[i % resolutionVariants.length];
    const location = locations[locationIndex];

    // Generate a date within the last year
    const daysToAdd = Math.floor(Math.random() * 365);
    const photoDate = new Date(startDate);
    photoDate.setDate(photoDate.getDate() + daysToAdd);

    photos.push({
      id: i + 1,
      url: `${imageVariant.url}?random=${i}`,
      width: imageVariant.width,
      height: imageVariant.height,
      title: `${location.name}の${category.season}の風景 - ${imageVariant.description}`,
      tags: [
        category.season,
        ...category.items,
        `${imageVariant.width}x${imageVariant.height}`,
      ],
      takenAt: photoDate,
      location: {
        ...location,
        lastVisited: photoDate,
      },
    });
  }

  return photos;
};
