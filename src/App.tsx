import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { ResultsTable } from './components/ResultsTable';
import { TemplateModal } from './components/TemplateModal';
import { DEFAULT_FILE_1, DEFAULT_FILE_2, parseCSV, parseNumber, exportToCSVFilename } from './utils/csvParser';
import { CsvDataset, ReconcileConfig, ReconcileResultItem, SavedTemplate } from './types';

export default function App() {
  const [file1Text, setFile1Text] = useState(DEFAULT_FILE_1);
  const [file2Text, setFile2Text] = useState(DEFAULT_FILE_2);

  const [config, setConfig] = useState<ReconcileConfig>({
    file1KeyCol: 'channel',
    file1ValCol: 'amount_invoiced',
    file2KeyCol: 'channel_name',
    file2ValCol: 'amount_paid',
    matchType: 'substring',
    multiMatchStrategy: 'sum',
    aggregateFile1: false,
  });

  const [results, setResults] = useState<ReconcileResultItem[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Parse datasets
  const file1Data = useMemo(() => parseCSV(file1Text), [file1Text]);
  const file2Data = useMemo(() => parseCSV(file2Text), [file2Text]);

  // Load templates from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xlookup_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load templates from localStorage', e);
    }
  }, []);

// =========================================================================
  // ADD THIS BLOCK: Listen for URL Query Parameters & Window PostMessages
  // =========================================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. Support fetching CSVs from URLs (e.g., ?file1_url=https://...&file2_url=https://...)
    const file1Url = params.get('file1_url');
    const file2Url = params.get('file2_url');

    if (file1Url) {
      fetch(file1Url)
        .then((res) => res.text())
        .then((text) => setFile1Text(text))
        .catch((err) => console.error('Failed to fetch File 1 from URL:', err));
    }

    if (file2Url) {
      fetch(file2Url)
        .then((res) => res.text())
        .then((text) => setFile2Text(text))
        .catch((err) => console.error('Failed to fetch File 2 from URL:', err));
    }

    // 2. Support direct raw CSV or Base64 text in URL (e.g., ?file1_text=...&file2_text=...)
    const rawFile1 = params.get('file1_text');
    const rawFile2 = params.get('file2_text');
    if (rawFile1) setFile1Text(decodeURIComponent(rawFile1));
    if (rawFile2) setFile2Text(decodeURIComponent(rawFile2));

    // 3. Optional: Override config mapping rules via URL (e.g., ?f1_key=id&f2_key=order_id)
    setConfig((prev) => ({
      ...prev,
      file1KeyCol: params.get('f1_key') || prev.file1KeyCol,
      file1ValCol: params.get('f1_val') || prev.file1ValCol,
      file2KeyCol: params.get('f2_key') || prev.file2KeyCol,
      file2ValCol: params.get('f2_val') || prev.file2ValCol,
      matchType: (params.get('match_type') as ReconcileConfig['matchType']) || prev.matchType,
      multiMatchStrategy: (params.get('strategy') as ReconcileConfig['multiMatchStrategy']) || prev.multiMatchStrategy,
      aggregateFile1: params.has('agg_f1') ? params.get('agg_f1') === 'true' : prev.aggregateFile1,
    }));

    // 4. Support cross-window / iframe injection via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOAD_RECONCILE_DATA') {
        if (event.data.file1Text) setFile1Text(event.data.file1Text);
        if (event.data.file2Text) setFile2Text(event.data.file2Text);
        if (event.data.config) {
          setConfig((prev) => ({ ...prev, ...event.data.config }));
        }
      }
    };
//--------------------------------------------------------------------------------------------
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-run reconciliation on initial load or when datasets/config change
  useEffect(() => {
    if (file1Data.headers.length > 0 && file2Data.headers.length > 0) {
      runReconciliation();
    }
  }, [file1Text, file2Text, config]);

  const runReconciliation = () => {
    if (!config.file1KeyCol || !config.file1ValCol || !config.file2KeyCol || !config.file2ValCol) {
      return;
    }

    const newResults: ReconcileResultItem[] = [];

    let processedFile1Rows = file1Data.rows;
    if (config.aggregateFile1) {
      const grouped = new Map<string, Record<string, string>>();
      file1Data.rows.forEach(row => {
        const rawKey = row[config.file1KeyCol] || '';
        const groupKey = rawKey.trim().toLowerCase();
        
        if (grouped.has(groupKey)) {
          const existing = grouped.get(groupKey)!;
          const currentVal = parseNumber(existing[config.file1ValCol]);
          const newVal = parseNumber(row[config.file1ValCol]);
          existing[config.file1ValCol] = (currentVal + newVal).toString();
        } else {
          grouped.set(groupKey, { ...row });
        }
      });
      processedFile1Rows = Array.from(grouped.values());
    }

    processedFile1Rows.forEach((row, idx) => {
      const lookupKey = row[config.file1KeyCol] || '';
      const f1Val = parseNumber(row[config.file1ValCol]);

      // Find matches in File 2
      const matchingFile2Rows = file2Data.rows.filter((f2Row) => {
        const f2Key = f2Row[config.file2KeyCol] || '';
        if (!lookupKey || !f2Key) return false;

        const cleanKey1 = lookupKey.trim().toLowerCase();
        const cleanKey2 = f2Key.trim().toLowerCase();

        if (config.matchType === 'exact') {
          return cleanKey1 === cleanKey2;
        } else {
          // Substring / Contains match (File 2 contains File 1 key or vice versa)
          return cleanKey2.includes(cleanKey1) || cleanKey1.includes(cleanKey2);
        }
      });

      const matched = matchingFile2Rows.length > 0;
      let f2Val = 0;

      if (matched) {
        if (config.multiMatchStrategy === 'sum') {
          f2Val = matchingFile2Rows.reduce(
            (acc, r) => acc + parseNumber(r[config.file2ValCol]),
            0
          );
        } else if (config.multiMatchStrategy === 'first') {
          f2Val = parseNumber(matchingFile2Rows[0][config.file2ValCol]);
        } else if (config.multiMatchStrategy === 'last') {
          f2Val = parseNumber(matchingFile2Rows[matchingFile2Rows.length - 1][config.file2ValCol]);
        }
      }

      const difference = f1Val - f2Val;
      const percentVariance = f2Val !== 0 ? (difference / Math.abs(f2Val)) * 100 : (f1Val !== 0 ? 100 : 0);

      newResults.push({
        id: `res-${idx}-${lookupKey}`,
        file1RowIndex: idx,
        lookupKey,
        file1Value: f1Val,
        matched,
        matchedFile2RowsCount: matchingFile2Rows.length,
        file2Value: f2Val,
        difference,
        percentVariance,
        file1OriginalRow: row,
      });
    });

    setResults(newResults);
  };

  const handleResetToDefaults = () => {
    setFile1Text(DEFAULT_FILE_1);
    setFile2Text(DEFAULT_FILE_2);
    setConfig({
      file1KeyCol: 'channel',
      file1ValCol: 'amount_invoiced',
      file2KeyCol: 'channel_name',
      file2ValCol: 'amount_paid',
      matchType: 'substring',
      multiMatchStrategy: 'sum',
      aggregateFile1: false,
    });
  };

  const handleSaveTemplate = (name: string) => {
    const newTpl: SavedTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      config,
      file1Text,
      file2Text,
    };
    const updated = [newTpl, ...templates];
    setTemplates(updated);
    try {
      localStorage.setItem('xlookup_templates', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save template to localStorage', e);
    }
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    setConfig(tpl.config);
    if (tpl.file1Text) setFile1Text(tpl.file1Text);
    if (tpl.file2Text) setFile2Text(tpl.file2Text);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    try {
      localStorage.setItem('xlookup_templates', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete template from localStorage', e);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ['Status', 'Lookup Key', 'File 1 Value', 'File 2 Looked-Up Value', 'Matched Rows Count', 'Difference', 'Percent Variance'];
    const csvRows = [headers.join(',')];

    results.forEach((r) => {
      const rowData = [
        r.matched ? 'TRUE' : 'FALSE',
        `"${r.lookupKey.replace(/"/g, '""')}"`,
        r.file1Value.toFixed(2),
        r.matched ? r.file2Value.toFixed(2) : '0.00',
        r.matchedFile2RowsCount,
        r.difference.toFixed(2),
        `${r.percentVariance.toFixed(2)}%`,
      ];
      csvRows.push(rowData.join(','));
    });

    exportToCSVFilename(`xlookup_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`, csvRows.join('\n'));
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased pb-12">
      <Header
        results={results}
        onExportCSV={handleExportCSV}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onResetToDefaults={handleResetToDefaults}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ConfigPanel
          file1Text={file1Text}
          setFile1Text={setFile1Text}
          file2Text={file2Text}
          setFile2Text={setFile2Text}
          file1Data={file1Data}
          file2Data={file2Data}
          config={config}
          setConfig={setConfig}
          onRunReconciliation={runReconciliation}
          onExportCSV={handleExportCSV}
          hasResults={results.length > 0}
        />

        <div className="mb-4 flex items-center justify-between border-t border-zinc-200 pt-8 mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">3. Reconciliation Results</h2>
        </div>

        <ResultsTable results={results} file1Headers={file1Data.headers} />
      </main>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        currentConfig={config}
        currentFile1Text={file1Text}
        currentFile2Text={file2Text}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </div>
  );
}
