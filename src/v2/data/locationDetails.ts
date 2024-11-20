import type { LocationDetail } from '../types/location';

export const locationDetails: { [key: string]: LocationDetail } = {
  '京都府 - 清水寺': {
    name: '清水寺',
    prefecture: '京都府',
    description:
      '京都を代表する寺院。舞台造りの本堂と美しい庭園で知られ、桜や紅葉の名所としても人気。世界文化遺産に登録された歴史ある寺院で、清水の舞台からの眺望は特に有名。',
    coverImage: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    tags: ['寺院', '世界遺産', '観光名所', '紅葉スポット', '桜名所'],
    yearlyVisitors: '約300万人',
    bestSeason: '春・秋',
  },
  '東京都 - 浅草寺': {
    name: '浅草寺',
    prefecture: '東京都',
    description:
      '東京都台東区浅草にある聖観音宗の仏教寺院。都内最古の寺院で、雷門と仲見世通りで知られる観光名所。伝統的な祭事や行事が年間を通じて行われている。',
    coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
    tags: ['寺院', '観光名所', '伝統文化', '下町'],
    yearlyVisitors: '約3000万人',
    bestSeason: '年間通じて',
  },
  '山梨県 - 富士山': {
    name: '富士山',
    prefecture: '山梨県',
    description:
      '日本最高峰の山。世界文化遺産に登録された日本の象徴的な名所。四季折々の美しい景色を楽しめる。山梨県側からの眺望は特に人気が高い。',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    tags: ['世界遺産', '山岳', '自然', '絶景'],
    yearlyVisitors: '約25万人（登山者）',
    bestSeason: '夏・秋',
  },
  '広島県 - 宮島': {
    name: '宮島',
    prefecture: '広島県',
    description:
      '世界遺産の厳島神社がある島。海に浮かぶ大鳥居と美しい自然景観で知られる。鹿との触れ合いや紅葉谷公園など、自然と文化が調和した観光地。',
    coverImage: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d',
    tags: ['世界遺産', '神社', '自然', '観光名所'],
    yearlyVisitors: '約450万人',
    bestSeason: '春・秋',
  },
};
