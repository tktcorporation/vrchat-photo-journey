import { useVirtualizer } from '@tanstack/react-virtual';
import type React from 'react';
import { useRef } from 'react';

const FixedHeightList: React.FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = Array.from({ length: 10000 }, (_, index) => ({
    id: index,
    title: `Row ${index + 1}`,
    description: `This is a fixed height row with ID ${index + 1}`,
  }));

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Fixed row height
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="absolute top-0 left-0 w-full border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="p-4">
              <div className="font-medium text-gray-900">
                {rows[virtualRow.index].title}
              </div>
              <div className="text-sm text-gray-500">
                {rows[virtualRow.index].description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FixedHeightList;
