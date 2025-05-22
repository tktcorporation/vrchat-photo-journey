import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `clsx` と `tailwind-merge` を用いてクラス名を結合するユーティリティ。
 *
 * @param inputs - 結合するクラス値。
 * @returns 重複のないクラス文字列。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
