import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import Button from './Button';

export default function DataTable({
  columns,
  data = [],
  onEdit,
  onDelete,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  isLoading = false,
  idKey = '_id',
  emptyState,
}) {
  const handleSelectAll = (e) => {
    if (!onSelectChange) return;
    if (e.target.checked) {
      onSelectChange(data.map((row) => row[idKey]));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectRow = (rowId, checked) => {
    if (!onSelectChange) return;
    if (checked) {
      onSelectChange([...selectedIds, rowId]);
    } else {
      onSelectChange(selectedIds.filter((id) => id !== rowId));
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium text-slate-500">Loading data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState || (
      <div className="text-center p-8 text-slate-500">No data available</div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            {selectable && (
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-28">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data.map((row, rowIdx) => {
            const rowId = row[idKey];
            const isSelected = selectedIds.includes(rowId);

            return (
              <tr
                key={rowId || rowIdx}
                className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                  isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                }`}
              >
                {selectable && (
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="p-4 text-sm text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="p-4 text-right space-x-1 whitespace-nowrap">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
