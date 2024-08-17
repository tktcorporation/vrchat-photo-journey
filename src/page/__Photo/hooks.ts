import { useCallback, useEffect, useRef } from 'react';
import React from 'react';

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

export const useComponentWidth = (props: {
  ref: React.RefObject<HTMLDivElement>;
  onChange?: (width: number | undefined) => void;
}): React.MutableRefObject<number | undefined> => {
  const width = useRef<number>();
  const setWidth = useCallback((value: number) => {
    if (width.current !== value) {
      width.current = value;
      if (props.onChange) {
        props.onChange(value);
      }
    }
    console.log(`setWidth: ${width.current}`);
  }, []);
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
    if (props.ref.current) {
      observer.current = new ResizeObserver(handleResize);
      observer.current.observe(props.ref.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [props.ref]);

  return width;
};

export const useComponentHeight = (props: {
  ref: React.RefObject<HTMLDivElement>;
  onChange?: (height: number | undefined) => void;
}): number | undefined => {
  const [height, _setHeight] = React.useState<number | undefined>(undefined);
  const setHeight = useCallback((value: number) => {
    _setHeight(value);
    if (props.onChange) {
      console.log(`useComponentHeight setHeight: ${value}`);
      props.onChange(value);
    }
  }, []);
  const observer = useRef<ResizeObserver | null>(null);

  const handleResize = useDebouncedCallback(
    (entries: ReadonlyArray<ResizeObserverEntry>) => {
      if (entries[0]?.contentRect) {
        setHeight(entries[0].contentRect.height);
      }
    },
    100,
  );

  useEffect(() => {
    if (props.ref.current) {
      observer.current = new ResizeObserver(handleResize);
      observer.current.observe(props.ref.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [props.ref]);

  return height;
};
