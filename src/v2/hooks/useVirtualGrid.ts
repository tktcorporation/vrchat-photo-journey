import { useVirtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';
import type { Photo } from '../types/photo';
import { useWindowSize } from './useWindowSize';

interface UseVirtualGridOptions {
  items: Photo[];
  parentRef: RefObject<HTMLDivElement>;
  rowHeight?: number;
  overscan?: number;
}

/**
 * 大量の写真を効率的に表示するためのグリッド仮想化フック。
 * 現状は未使用だが無限スクロール実装の基礎として準備されている。
 */
export const useVirtualGrid = ({
  items,
  parentRef,
  rowHeight = 320,
  overscan = 3,
}: UseVirtualGridOptions) => {
  const windowSize = useWindowSize();

  const getColumnCount = (width?: number) => {
    if (!width || width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  };

  const columnCount = getColumnCount(windowSize.width);
  const rowCount = Math.ceil(items.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const getItemsForRow = (rowIndex: number) => {
    const startIndex = rowIndex * columnCount;
    return Array.from({ length: columnCount }).map((_, colIndex) => {
      const itemIndex = startIndex + colIndex;
      return items[itemIndex];
    });
  };

  return {
    virtualizer,
    columnCount,
    getItemsForRow,
    totalSize: virtualizer.getTotalSize(),
    virtualRows: virtualizer.getVirtualItems(),
  };
};
