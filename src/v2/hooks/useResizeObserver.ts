import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

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
