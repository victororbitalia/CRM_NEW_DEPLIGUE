import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  bordered?: boolean;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = false, hoverable = true, compact = false, bordered = false, children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn(
            'min-w-full divide-y divide-secondary-200',
            striped && 'divide-y-0',
            bordered && 'border border-secondary-200',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-secondary-50', className)} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  striped?: boolean;
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, striped = false, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(
        'bg-white divide-y divide-secondary-200',
        striped && 'divide-y-0',
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, children, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-secondary-50 font-medium', className)}
      {...props}
    >
      {children}
    </tfoot>
  )
);

TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  selected?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, striped = false, hoverable = true, selected = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        striped && 'even:bg-secondary-50',
        hoverable && 'hover:bg-secondary-50',
        selected && 'bg-primary-50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = 'TableRow';

export interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  compact?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, compact = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-6 py-4 whitespace-nowrap text-sm text-secondary-900',
        compact && 'px-4 py-2',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';

export interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  sortable?: boolean;
  sorted?: 'asc' | 'desc';
  onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable = false, sorted, onSort, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-secondary-100',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center">
        {children}
        {sortable && (
          <span className="ml-2">
            {sorted === 'asc' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : sorted === 'desc' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  )
);

TableHead.displayName = 'TableHead';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  children: ReactNode;
}

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, children, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('py-3 text-sm text-secondary-600 text-left', className)}
      {...props}
    >
      {children}
    </caption>
  )
);

TableCaption.displayName = 'TableCaption';

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  action?: ReactNode;
}

export function TableEmpty({ colSpan, message = 'No hay datos disponibles', action }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-secondary-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-secondary-500 mb-4">{message}</p>
          {action}
        </div>
      </td>
    </tr>
  );
}

export default Table;