/**
 * CSV export via browser download — no server round-trip required.
 */

export function exportCSV(headers: string[], rows: (string | number)[][], filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const csv = BOM + [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
