import { useEffect, useState, RefObject } from 'react';

export function useInView(elementRef: RefObject<Element>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);

  return isInView;
}