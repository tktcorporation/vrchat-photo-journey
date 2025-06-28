/**
 * UIコンポーネントで使用する共通定数を一元管理
 */

/**
 * アイコンサイズの標準定義
 * Tailwindクラスとピクセルサイズの両方に対応
 */
export const ICON_SIZE = {
  /** 極小サイズ (12px) - バッジ等で使用 */
  xs: {
    class: 'h-3 w-3',
    pixels: 12,
  },
  /** 小サイズ (16px) - デフォルトサイズ */
  sm: {
    class: 'h-4 w-4',
    pixels: 16,
  },
  /** 中サイズ (20px) - ボタンアイコン等で使用 */
  md: {
    class: 'h-5 w-5',
    pixels: 20,
  },
  /** 大サイズ (32px) - ローディングアイコン等で使用 */
  lg: {
    class: 'h-8 w-8',
    pixels: 32,
  },
  /** 特大サイズ (24px) - PhotoCard専用 */
  photo: {
    class: 'h-6 w-6',
    pixels: 24,
  },
} as const;

export type IconSizeKey = keyof typeof ICON_SIZE;
export type IconSizeValue = (typeof ICON_SIZE)[IconSizeKey];
