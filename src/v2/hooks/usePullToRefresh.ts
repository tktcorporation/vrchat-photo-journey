import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  threshold?: number;
  containerRef: RefObject<HTMLElement>;
}

export function usePullToRefresh({
  onRefresh,
  isRefreshing,
  threshold = 100,
  containerRef,
}: UsePullToRefreshOptions) {
  const pullStartY = useRef(0);
  const refreshIndicatorRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [pullProgress, setPullProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
        isDraggingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const pullDistance = touchY - pullStartY.current;

      if (pullDistance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const progress = Math.min(pullDistance / threshold, 1);
        setPullProgress(progress);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current || isRefreshing) return;

      if (pullProgress >= 0.6) {
        await onRefresh();
      }

      setPullProgress(0);
      isDraggingRef.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, threshold, containerRef, pullProgress]);

  return { refreshIndicatorRef, pullProgress };
}
