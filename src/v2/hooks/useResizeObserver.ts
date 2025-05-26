import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

const SIZE_CHANGE_THRESHOLD = 1; // Minimum pixel change to trigger update

export function useResizeObserver<T extends HTMLElement>(): [
  RefObject<T>,
  Size,
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver>();
  const timeoutRef = useRef<number>();
  const lastSizeRef = useRef<Size>({ width: 0, height: 0 });

  const updateSize = useCallback((newSize: Size) => {
    const sizeChanged = 
      Math.abs(newSize.width - lastSizeRef.current.width) > SIZE_CHANGE_THRESHOLD ||
      Math.abs(newSize.height - lastSizeRef.current.height) > SIZE_CHANGE_THRESHOLD;

    if (sizeChanged) {
      lastSizeRef.current = newSize;
      setSize(newSize);
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    observerRef.current = new ResizeObserver((entries) => {
      try {
        if (!entries[0]) return;

        const { width, height } = entries[0].contentRect;
        
        // Debounce size updates to prevent rapid changes
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = window.setTimeout(() => {
          updateSize({ width, height });
        }, 16); // ~60fps
      } catch (error) {
        // Ignore ResizeObserver loop errors to prevent console spam
        if (error instanceof Error && error.message.includes('ResizeObserver loop')) {
          return;
        }
        console.error('ResizeObserver error:', error);
      }
    });

    observerRef.current.observe(element);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, [updateSize]);

  return [ref, size];
}
