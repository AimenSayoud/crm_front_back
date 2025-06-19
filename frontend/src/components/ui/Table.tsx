// src/components/ui/Table.tsx
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface Column<T> {
  key: string;
  title: string;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey: (record: T) => string;
  onRowClick?: (record: T) => void;
  className?: string;
}

function Table<T>({
  columns,
  data,
  loading = false,
  emptyText = 'No data',
  rowKey,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const { colors } = useTheme();

  const renderLoading = () => (
    <tr>
      <td
        colSpan={columns.length}
        className="text-center py-8"
        style={{ color: colors.text }}
      >
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 mr-3"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </div>
      </td>
    </tr>
  );

  const renderEmpty = () => (
    <tr>
      <td
        colSpan={columns.length}
        className="text-center py-8"
        style={{ color: `${colors.text}99` }}
      >
        {emptyText}
      </td>
    </tr>
  );

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className="min-w-full divide-y"
        style={{ borderColor: colors.border }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ 
                  color: `${colors.text}99`,
                  backgroundColor: colors.card,
                  width: column.width
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={`divide-y`}
          style={{ borderColor: colors.border }}
        >
          {loading
            ? renderLoading()
            : data.length === 0
            ? renderEmpty()
            : data.map((record, index) => (
                <tr
                  key={rowKey(record)}
                  className={`hover:bg-opacity-50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{
                    backgroundColor: colors.card,
                  }}
                  onClick={() => onRowClick && onRowClick(record)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowKey(record)}-${column.key}`}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      style={{ color: colors.text }}
                    >
                      {column.render
                        ? column.render(record[column.key as keyof T], record, index)
                        : record[column.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;