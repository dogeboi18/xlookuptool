import { CsvDataset } from '../types';

export const DEFAULT_FILE_1 = `date,channel,amount_invoiced
9/2/2026,Amazon.com,1501701.23
9/2/2026,Walmart,188633.04
9/2/2026,Sams Club,144518.2`;

export const DEFAULT_FILE_2 = `date,ledger_ref,channel_name,amount_paid
9/2/2026,REF-101,"E-Comm : Amazon - EDI",1000000.00
9/2/2026,REF-102,"E-Comm : Amazon - EDI",501701.23
9/2/2026,REF-103,"Retail : Walmart - EDI",188633.04
9/2/2026,REF-104,"Wholesale : Sams Club - EDI",70000.00
9/2/2026,REF-105,"Wholesale : Sams Club - EDI",74518.20
9/2/2026,REF-106,"Target - Direct",50000.00`;

export function parseCSV(text: string): CsvDataset {
  if (!text || !text.trim()) {
    return { rawText: '', headers: [], rows: [] };
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // push last field/row if any
  currentRow.push(currentField.trim());
  if (currentRow.some(field => field !== '')) {
    lines.push(currentRow);
  }

  if (lines.length === 0) {
    return { rawText: text, headers: [], rows: [] };
  }

  const rawHeaders = lines[0];
  // Ensure unique headers if duplicates exist
  const headers = rawHeaders.map((h, idx) => h || `col_${idx + 1}`);

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    rows.push(rowObj);
  }

  return {
    rawText: text,
    headers,
    rows,
  };
}

export function parseNumber(val: string): number {
  if (!val) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = val.replace(/[$€£,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function exportToCSVFilename(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
