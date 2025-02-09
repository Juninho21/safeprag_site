import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

interface Column {
  field: string;
  headerName: string;
  width?: number;
  renderCell?: (params: any) => React.ReactNode;
}

interface DataGridProps {
  rows: any[];
  columns: Column[];
  getRowId: (row: any) => string;
  autoHeight?: boolean;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  disableSelectionOnClick?: boolean;
  disableColumnMenu?: boolean;
  localeText?: {
    noRowsLabel?: string;
    footerRowSelected?: (count: number) => string;
  };
}

export function DataGrid({
  rows,
  columns,
  getRowId,
  pageSize = 30,
  localeText,
}: DataGridProps) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const totalPages = Math.ceil(rows.length / pageSize);
  
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = rows.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.field}
                  className="whitespace-nowrap"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.headerName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  {localeText?.noRowsLabel || 'Nenhum registro encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.field} className="whitespace-nowrap">
                      {column.renderCell ? column.renderCell({ row }) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1}-{Math.min(endIndex, rows.length)} de {rows.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
