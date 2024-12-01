import { useVirtualizer } from '@tanstack/react-virtual';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const VariableHeightList: React.FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<{ [key: number]: number }>(
    {},
  );

  // Generate rows with variable content lengths
  const rows = Array.from({ length: 10000 }, (_, index) => ({
    id: index,
    title: `Row ${index + 1}`,
    description: `This is a variable height row with ID ${index + 1}. ${Array(
      Math.floor(Math.random() * 3) + 1,
    )
      .fill('Some additional content to make this row taller. ')
      .join('')}`,
  }));

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => measurements[index] ?? 100,
    overscan: 5,
    measureElement: (element) => {
      const height = element.getBoundingClientRect().height;
      const index = element.getAttribute('data-index');
      if (index !== null) {
        setMeasurements((prev) => ({
          ...prev,
          [Number(index)]: height,
        }));
      }
      return height;
    },
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
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="absolute top-0 left-0 w-full border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="p-4">
              <div className="font-medium text-gray-900">
                {rows[virtualRow.index].title}
              </div>
              <div className="text-sm text-gray-500 whitespace-pre-wrap">
                {rows[virtualRow.index].description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariableHeightList;
