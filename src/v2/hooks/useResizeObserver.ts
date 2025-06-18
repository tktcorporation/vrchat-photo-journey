import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

/**
 * DOM 要素のサイズ変化を監視し、最新の幅と高さを返すフック。
 * 現状このリポジトリ内では使用されていないが、
 * コンポーネントの動的レイアウト調整に利用できる。
 */
export function useResizeObserver<T extends HTMLElement>(): [
  RefObject<T>,
  Size,
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver>();

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    observerRef.current = new ResizeObserver((entries) => {
      if (!entries[0]) return;

      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [ref, size];
}
