import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualTableProps {
  data: any[];
  rowHeight: number;
  visibleRows: number;
  renderRow: (index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  className?: string;
}

export const VirtualTable: React.FC<VirtualTableProps> = React.memo(({
  data,
  rowHeight,
  visibleRows,
  renderRow,
  renderHeader,
  className,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{
        height: `${rowHeight * visibleRows}px`,
        width: '100%',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {renderHeader && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {renderHeader()}
          </div>
        )}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderRow(virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualTable.displayName = 'VirtualTable';
