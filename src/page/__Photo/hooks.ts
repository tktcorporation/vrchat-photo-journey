import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type CallbackFunction = (...args: any[]) => void;

const useDebouncedCallback = <T extends CallbackFunction>(
  callback: T,
  delay: number,
): T => {
  const timeoutRef = useRef<number | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;

  return debouncedCallback;
};

export const useComponentWidth = (
  ref: React.RefObject<HTMLDivElement>,
): number | undefined => {
  const [width, setWidth] = useState<number>();
  const observer = useRef<ResizeObserver | null>(null);

  const handleResize = useDebouncedCallback(
    (entries: ReadonlyArray<ResizeObserverEntry>) => {
      if (entries[0]?.contentRect) {
        setWidth(entries[0].contentRect.width);
      }
    },
    100,
  );

  useEffect(() => {
    if (ref.current) {
      observer.current = new ResizeObserver(handleResize);
      observer.current.observe(ref.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [ref, handleResize]);

  return width;
};
