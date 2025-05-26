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
      try {
        if (!entries[0]) return;

        const { width, height } = entries[0].contentRect;
        // Only update if size actually changed to prevent unnecessary re-renders
        setSize((prev) => {
          if (Math.abs(prev.width - width) > 1 || Math.abs(prev.height - height) > 1) {
            return { width, height };
          }
          return prev;
        });
      } catch (error) {
        // Catch and ignore ResizeObserver loop errors silently
        if (error instanceof Error && !error.message.includes('ResizeObserver loop')) {
          console.warn('ResizeObserver error:', error);
        }
      }
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [ref, size];
}
