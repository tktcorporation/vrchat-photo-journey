import { useEffect, useState } from 'react';

/**
 * 値の変更を遅延させるカスタムフック
 * 検索入力など頻繁に変更される値のパフォーマンス最適化に使用
 * @param value - デバウンスする値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 値が変更されたらタイマーをセット
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // クリーンアップ関数でタイマーをクリア
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
