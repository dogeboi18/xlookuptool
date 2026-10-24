import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseCSV, parseNumber } from '../src/utils/csvParser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      file1Text,
      file2Text,
      config = {}
    } = req.body;

    if (!file1Text || !file2Text) {
      return res.status(400).json({ error: 'Missing file1Text or file2Text in request body.' });
    }

    // Apply default config or overrides from Make.com
    const recConfig = {
      file1KeyCol: config.file1KeyCol || 'channel',
      file1ValCol: config.file1ValCol || 'amount_invoiced',
      file2KeyCol: config.file2KeyCol || 'channel_name',
      file2ValCol: config.file2ValCol || 'amount_paid',
      matchType: config.matchType || 'substring', // 'exact' | 'substring'
      multiMatchStrategy: config.multiMatchStrategy || 'sum', // 'sum' | 'first' | 'last'
      aggregateFile1: Boolean(config.aggregateFile1 ?? false),
    };

    const file1Data = parseCSV(file1Text);
    const file2Data = parseCSV(file2Text);

    // 1. Optional Aggregation on File 1
    let processedFile1Rows = file1Data.rows;
    if (recConfig.aggregateFile1) {
      const grouped = new Map<string, Record<string, string>>();
      file1Data.rows.forEach((row: Record<string, string>) => {
        const rawKey = row[recConfig.file1KeyCol] || '';
        const groupKey = rawKey.trim().toLowerCase();

        if (grouped.has(groupKey)) {
          const existing = grouped.get(groupKey)!;
          const currentVal = parseNumber(existing[recConfig.file1ValCol]);
          const newVal = parseNumber(row[recConfig.file1ValCol]);
          existing[recConfig.file1ValCol] = (currentVal + newVal).toString();
        } else {
          grouped.set(groupKey, { ...row });
        }
      });
      processedFile1Rows = Array.from(grouped.values());
    }

    // 2. Run Reconciliation & Build CSV Output Rows
    const headers = [
      'Status',
      'Lookup Key',
      'File 1 Value',
      'File 2 Looked-Up Value',
      'Matched Rows Count',
      'Difference',
      'Percent Variance'
    ];
    const csvRows = [headers.join(',')];

    processedFile1Rows.forEach((row: Record<string, string>) => {
      const lookupKey = row[recConfig.file1KeyCol] || '';
      const f1Val = parseNumber(row[recConfig.file1ValCol]);

      const matchingFile2Rows = file2Data.rows.filter((f2Row: Record<string, string>) => {
        const f2Key = f2Row[recConfig.file2KeyCol] || '';
        if (!lookupKey || !f2Key) return false;

        const cleanKey1 = lookupKey.trim().toLowerCase();
        const cleanKey2 = f2Key.trim().toLowerCase();

        if (recConfig.matchType === 'exact') {
          return cleanKey1 === cleanKey2;
        } else {
          return cleanKey2.includes(cleanKey1) || cleanKey1.includes(cleanKey2);
        }
      });

      const matched = matchingFile2Rows.length > 0;
      let f2Val = 0;

      if (matched) {
        if (recConfig.multiMatchStrategy === 'sum') {
          f2Val = matchingFile2Rows.reduce(
            (acc: number, r: Record<string, string>) => acc + parseNumber(r[recConfig.file2ValCol]),
            0
          );
        } else if (recConfig.multiMatchStrategy === 'first') {
          f2Val = parseNumber(matchingFile2Rows[0][recConfig.file2ValCol]);
        } else if (recConfig.multiMatchStrategy === 'last') {
          f2Val = parseNumber(matchingFile2Rows[matchingFile2Rows.length - 1][recConfig.file2ValCol]);
        }
      }

      const difference = f1Val - f2Val;
      const percentVariance = f2Val !== 0 ? (difference / Math.abs(f2Val)) * 100 : (f1Val !== 0 ? 100 : 0);

      const rowData = [
        matched ? 'TRUE' : 'FALSE',
        `"${lookupKey.replace(/"/g, '""')}"`,
        f1Val.toFixed(2),
        matched ? f2Val.toFixed(2) : '0.00',
        matchingFile2Rows.length,
        difference.toFixed(2),
        `${percentVariance.toFixed(2)}%`,
      ];
      csvRows.push(rowData.join(','));
    });

    const finalCsvString = csvRows.join('\n');
    const filename = `xlookup_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;

    // Automatically save copy to repository reconciliations folder if available
    try {
      const fs = await import('fs');
      const path = await import('path');
      const repoDir = path.resolve(process.cwd(), 'reconciliations');
      if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const autoSaveName = `reconciliation_${timestamp}.csv`;
      fs.writeFileSync(path.join(repoDir, autoSaveName), finalCsvString, 'utf-8');
    } catch (saveErr) {
      console.warn('Could not auto-save to reconciliations directory:', saveErr);
    }

    // Return as a raw CSV file stream so Make.com can pass it straight to Google Drive
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(finalCsvString);

  } catch (error: any) {
    console.error('Reconciliation API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}