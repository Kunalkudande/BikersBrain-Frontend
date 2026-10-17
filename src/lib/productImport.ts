export const IMPORT_HEADERS = ['name', 'brand', 'category', 'description', 'price', 'stock', 'sku', 'discountPrice', 'lowStockThreshold', 'isActive', 'imageUrls', 'details'];
export interface ImportRow { row: number; values: Record<string, string>; }

/** RFC 4180-style CSV, including multiline descriptions and escaped quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"') {
      if (cell || closed) throw new Error('Unexpected quote. Use the CSV template.');
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (c !== ',') { rows.push(row); row = []; if (c === '\r' && input[i + 1] === '\n') i++; }
    } else {
      if (closed && c.trim()) throw new Error('Unexpected text after a closing quote.');
      if (!closed) cell += c;
    }
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows;
}

export function importRows(matrix: unknown[][]): ImportRow[] {
  if (!matrix.length) throw new Error('The file is empty.');
  const headers = matrix[0].map(cell => String(cell ?? '').trim());
  if (new Set(headers).size !== headers.length) throw new Error('Column names must be unique.');
  if (headers.some(header => !IMPORT_HEADERS.includes(header))) throw new Error('Unknown or blank column name. Start with the template.');
  for (const required of ['name', 'brand', 'category', 'description', 'price', 'stock']) if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`);
  const rows = matrix.slice(1).map((cells, index) => ({ cells, row: index + 2 })).filter(({ cells }) => cells.some(cell => cell != null && String(cell).trim()));
  if (!rows.length || rows.length > 200) throw new Error('Upload between 1 and 200 product rows at a time.');
  return rows.map(({ cells, row }) => {
    if (cells.length > headers.length && cells.slice(headers.length).some(cell => String(cell ?? '').trim())) throw new Error(`Row ${row} has extra columns.`);
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      const cell = cells[index];
      if (cell instanceof Date || (cell != null && !['string', 'number', 'boolean'].includes(typeof cell))) throw new Error(`Row ${row}: use plain text or numbers, not dates or complex cells.`);
      values[header] = String(cell ?? '').trim();
    });
    return { row, values };
  });
}

export async function readProductFile(file: File): Promise<ImportRow[]> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Files must be 2 MB or smaller.');
  if (/\.csv$/i.test(file.name)) return importRows(parseCsv(await file.text()));
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import('read-excel-file/browser');
    return importRows(await readSheet(file));
  }
  throw new Error('Choose a CSV or .xlsx file. Save older .xls files as .xlsx first.');
}

export function csvDownload(name: string, matrix: unknown[][]) {
  const escape = (cell: unknown) => {
    let value = String(cell ?? '');
    // Prevent spreadsheet formula injection when exporting imported text or server errors.
    if (/^[\s]*[=+@-]/.test(value)) value = "'" + value;
    return '"' + value.replace(/"/g, '""') + '"';
  };
  const url = URL.createObjectURL(new Blob(['\uFEFF' + matrix.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
