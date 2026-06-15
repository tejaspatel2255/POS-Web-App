import Papa from 'papaparse';

/**
 * Exports data to a CSV file and triggers download
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 */
export function exportToCSV(data, filename = 'export') {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Convert array of objects to CSV string
  const csv = Papa.unparse(data);

  // Create file and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
