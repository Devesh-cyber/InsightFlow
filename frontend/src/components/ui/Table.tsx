import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T, index: number) => string;
}

export function Table<T>({ columns, rows, keyFn }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-sunken">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-3 py-2 text-xs font-medium text-ink-soft ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={keyFn(row, i)} className="border-b border-line last:border-0 hover:bg-surface-sunken/60">
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-3 py-2 text-ink ${col.mono ? 'font-mono' : ''} ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
