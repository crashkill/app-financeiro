import React from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc' | null) => void;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  emptyText?: string;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  sortable = false,
  onSort,
  rowKey = 'id',
  onRowClick,
  className,
  size = 'md',
  striped = false,
  bordered = false,
  hoverable = true,
  emptyText = 'Nenhum dado encontrado'
}: TableProps<T>) => {
  const [sortState, setSortState] = React.useState<SortState>({
    key: null,
    direction: null
  });
  
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] || index);
  };
  
  const handleSort = (columnKey: string) => {
    if (!sortable && !onSort) return;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    
    if (sortState.key === columnKey) {
      if (sortState.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortState.direction === 'desc') {
        newDirection = null;
      }
    }
    
    setSortState({ key: columnKey, direction: newDirection });
    onSort?.(columnKey, newDirection);
  };
  
  const getSortIcon = (columnKey: string) => {
    if (sortState.key !== columnKey) {
      return <ChevronsUpDown size={14} className="text-gray-400" />;
    }
    
    if (sortState.direction === 'asc') {
      return <ChevronUp size={14} className="text-blue-500" />;
    }
    
    if (sortState.direction === 'desc') {
      return <ChevronDown size={14} className="text-blue-500" />;
    }
    
    return <ChevronsUpDown size={14} className="text-gray-400" />;
  };
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const cellPadding = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  };
  
  const tableClasses = clsx(
    'w-full table-auto',
    sizeClasses[size],
    bordered && 'border border-gray-200 dark:border-gray-700',
    className
  );
  
  const renderCell = (column: Column<T>, record: T, index: number) => {
    if (column.render) {
      return column.render(record[column.dataIndex as keyof T], record, index);
    }
    
    if (column.dataIndex) {
      return record[column.dataIndex];
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando...</span>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className={tableClasses}>
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => {
              const isSortable = (sortable || column.sortable) && onSort;
              
              return (
                <th
                  key={column.key}
                  className={clsx(
                    cellPadding[size],
                    'font-medium text-gray-900 dark:text-gray-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    isSortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none',
                    bordered && 'border-r border-gray-200 dark:border-gray-700 last:border-r-0',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => isSortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.title}</span>
                    {isSortable && getSortIcon(column.key)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={clsx(
                  cellPadding[size],
                  'text-center text-gray-500 dark:text-gray-400'
                )}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={clsx(
                  striped && index % 2 === 1 && 'bg-gray-50 dark:bg-gray-800',
                  hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800',
                  onRowClick && 'cursor-pointer',
                  'transition-colors duration-150'
                )}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      cellPadding[size],
                      'text-gray-900 dark:text-gray-100',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      bordered && 'border-r border-gray-200 dark:border-gray-700 last:border-r-0',
                      column.className
                    )}
                  >
                    {renderCell(column, record, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {pagination && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((pagination.current - 1) * pagination.pageSize) + 1} a{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current <= 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {pagination.current} de {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;