// File: /api/reconcile.js

function parseNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const rawText = await request.text();
      let body = {};
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        return new Response(
          JSON.stringify({
            error: 'Make sent invalid JSON (likely unescaped CSV newlines/quotes). Wrap file data in base64() in Make.',
            preview: rawText.slice(0, 150),
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let { file1Text, file2Text, file1Base64, file2Base64, config = {} } = body;

      if (file1Base64) file1Text = Buffer.from(file1Base64, 'base64').toString('utf-8');
      if (file2Base64) file2Text = Buffer.from(file2Base64, 'base64').toString('utf-8');

      if (!file1Text || !file2Text) {
        return new Response(
          JSON.stringify({ error: 'Missing file1 or file2 data', keysReceived: Object.keys(body) }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const recConfig = {
        file1KeyCol: config.file1KeyCol || 'channel',
        file1ValCol: config.file1ValCol || 'amount_invoiced',
        file2KeyCol: config.file2KeyCol || 'channel_name',
        file2ValCol: config.file2ValCol || 'amount_paid',
        matchType: config.matchType || 'substring',
        multiMatchStrategy: config.multiMatchStrategy || 'sum',
        aggregateFile1: Boolean(config.aggregateFile1 ?? false),
      };

      const file1Data = parseCSV(file1Text);
      const file2Data = parseCSV(file2Text);

      let processedFile1Rows = file1Data.rows;
      if (recConfig.aggregateFile1) {
        const grouped = new Map();
        file1Data.rows.forEach((row) => {
          const rawKey = row[recConfig.file1KeyCol] || '';
          const groupKey = rawKey.trim().toLowerCase();

          if (grouped.has(groupKey)) {
            const existing = grouped.get(groupKey);
            const currentVal = parseNumber(existing[recConfig.file1ValCol]);
            const newVal = parseNumber(row[recConfig.file1ValCol]);
            existing[recConfig.file1ValCol] = (currentVal + newVal).toString();
          } else {
            grouped.set(groupKey, { ...row });
          }
        });
        processedFile1Rows = Array.from(grouped.values());
      }

      const headers = [
        'Status',
        'Lookup Key',
        'File 1 Value',
        'File 2 Looked-Up Value',
        'Matched Rows Count',
        'Difference',
        'Percent Variance',
      ];
      const csvRows = [headers.join(',')];

      processedFile1Rows.forEach((row) => {
        const lookupKey = row[recConfig.file1KeyCol] || '';
        const f1Val = parseNumber(row[recConfig.file1ValCol]);

        const matchingFile2Rows = file2Data.rows.filter((f2Row) => {
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
            f2Val = matchingFile2Rows.reduce((acc, r) => acc + parseNumber(r[recConfig.file2ValCol]), 0);
          } else if (recConfig.multiMatchStrategy === 'first') {
            f2Val = parseNumber(matchingFile2Rows[0][recConfig.file2ValCol]);
          } else if (recConfig.multiMatchStrategy === 'last') {
            f2Val = parseNumber(matchingFile2Rows[matchingFile2Rows.length - 1][recConfig.file2ValCol]);
          }
        }

        const difference = f1Val - f2Val;
        const percentVariance = f2Val !== 0 ? (difference / Math.abs(f2Val)) * 100 : f1Val !== 0 ? 100 : 0;

        const rowData = [
          matched ? 'TRUE' : 'FALSE',
          `"${String(lookupKey).replace(/"/g, '""')}"`,
          f1Val.toFixed(2),
          matched ? f2Val.toFixed(2) : '0.00',
          matchingFile2Rows.length,
          difference.toFixed(2),
          `${percentVariance.toFixed(2)}%`,
        ];
        csvRows.push(rowData.join(','));
      });

      return new Response(csvRows.join('\n'), {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};