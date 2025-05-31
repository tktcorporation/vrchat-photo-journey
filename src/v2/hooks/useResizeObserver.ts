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
    const previousSize = { width: 0, height: 0 };

    try {
      observerRef.current = new ResizeObserver((entries) => {
        try {
          if (!entries[0]) return;

          const { width, height } = entries[0].contentRect;

          // Only update if the size actually changed significantly
          const threshold = 1;
          if (
            Math.abs(width - previousSize.width) > threshold ||
            Math.abs(height - previousSize.height) > threshold
          ) {
            previousSize.width = width;
            previousSize.height = height;
            setSize({ width, height });
          }
        } catch (error) {
          console.warn('ResizeObserver entry processing error:', error);
        }
      });

      observerRef.current.observe(element);
    } catch (error) {
      console.warn('ResizeObserver creation failed:', error);
    }

    return () => {
      try {
        observerRef.current?.disconnect();
      } catch (error) {
        console.warn('ResizeObserver disconnect error:', error);
      }
    };
  }, []);

  return [ref, size];
}
