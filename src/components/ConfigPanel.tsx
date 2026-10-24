import React, { useState } from 'react';
import { CsvDataset, ReconcileConfig, MatchType, MultiMatchStrategy } from '../types';

interface ConfigPanelProps {
  file1Text: string;
  setFile1Text: (text: string) => void;
  file2Text: string;
  setFile2Text: (text: string) => void;
  file1Data: CsvDataset;
  file2Data: CsvDataset;
  config: ReconcileConfig;
  setConfig: React.Dispatch<React.SetStateAction<ReconcileConfig>>;
  onRunReconciliation: () => void;
  onExportCSV?: () => void;
  hasResults?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  file1Text,
  setFile1Text,
  file2Text,
  setFile2Text,
  file1Data,
  file2Data,
  config,
  setConfig,
  onRunReconciliation,
  onExportCSV,
  hasResults = false,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'file1' | 'file2') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === 'file1') {
        setFile1Text(content);
      } else {
        setFile2Text(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-8 space-y-8">
      {/* Step 1: Data Sources */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">1. Data Sources</h2>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {showRaw ? 'Hide Raw Text' : 'Edit Raw Text'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-medium text-zinc-700">Primary Data (File 1)</label>
              <span className="text-[10px] text-zinc-500">{file1Data.rows.length} rows</span>
            </div>
            {showRaw ? (
              <textarea
                value={file1Text}
                onChange={(e) => setFile1Text(e.target.value)}
                className="w-full h-32 text-xs font-mono p-2 border border-zinc-200 rounded-md focus:border-black focus:ring-0"
              />
            ) : (
              <label className="flex flex-col items-center justify-center h-20 border border-dashed border-zinc-300 rounded-md bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                <span className="text-xs text-zinc-600 font-medium">Upload File 1 CSV</span>
                <input type="file" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'file1')} className="hidden" />
              </label>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-medium text-zinc-700">Reference Ledger (File 2)</label>
              <span className="text-[10px] text-zinc-500">{file2Data.rows.length} rows</span>
            </div>
            {showRaw ? (
              <textarea
                value={file2Text}
                onChange={(e) => setFile2Text(e.target.value)}
                className="w-full h-32 text-xs font-mono p-2 border border-zinc-200 rounded-md focus:border-black focus:ring-0"
              />
            ) : (
              <label className="flex flex-col items-center justify-center h-20 border border-dashed border-zinc-300 rounded-md bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                <span className="text-xs text-zinc-600 font-medium">Upload File 2 CSV</span>
                <input type="file" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'file2')} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Step 2: Mapping & Rules */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 mb-3">2. Mapping & Rules</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Mappings */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Lookup Key (F1)</label>
                  <select
                    value={config.file1KeyCol}
                    onChange={(e) => setConfig({ ...config, file1KeyCol: e.target.value })}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 focus:border-black focus:ring-0"
                  >
                    <option value="">-- Select --</option>
                    {file1Data.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Value Column (F1)</label>
                  <select
                    value={config.file1ValCol}
                    onChange={(e) => setConfig({ ...config, file1ValCol: e.target.value })}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 focus:border-black focus:ring-0"
                  >
                    <option value="">-- Select --</option>
                    {file1Data.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Lookup Key (F2)</label>
                  <select
                    value={config.file2KeyCol}
                    onChange={(e) => setConfig({ ...config, file2KeyCol: e.target.value })}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 focus:border-black focus:ring-0"
                  >
                    <option value="">-- Select --</option>
                    {file2Data.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Value Column (F2)</label>
                  <select
                    value={config.file2ValCol}
                    onChange={(e) => setConfig({ ...config, file2ValCol: e.target.value })}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 focus:border-black focus:ring-0"
                  >
                    <option value="">-- Select --</option>
                    {file2Data.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Match Type</label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
                  <input type="radio" value="exact" checked={config.matchType === 'exact'} onChange={() => setConfig({ ...config, matchType: 'exact' })} className="text-black focus:ring-black" />
                  <span>Exact Match</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
                  <input type="radio" value="substring" checked={config.matchType === 'substring'} onChange={() => setConfig({ ...config, matchType: 'substring' })} className="text-black focus:ring-black" />
                  <span>Substring Match</span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Multi-Match Strategy</label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
                  <input type="radio" value="sum" checked={config.multiMatchStrategy === 'sum'} onChange={() => setConfig({ ...config, multiMatchStrategy: 'sum' })} className="text-black focus:ring-black" />
                  <span>Sum Values</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
                  <input type="radio" value="first" checked={config.multiMatchStrategy === 'first'} onChange={() => setConfig({ ...config, multiMatchStrategy: 'first' })} className="text-black focus:ring-black" />
                  <span>Take First</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
                  <input type="radio" value="last" checked={config.multiMatchStrategy === 'last'} onChange={() => setConfig({ ...config, multiMatchStrategy: 'last' })} className="text-black focus:ring-black" />
                  <span>Take Last</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-zinc-100">
            <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.aggregateFile1} 
                onChange={() => setConfig({ ...config, aggregateFile1: !config.aggregateFile1 })} 
                className="text-black focus:ring-black rounded-sm border-zinc-300" 
              />
              <span>Aggregate File 1 Duplicate Keys (Sum values before matching) Note: Check this if comparing Lines Data</span>
            </label>
          </div>
        </div>
      </section>

      {/* Execute */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-zinc-200">
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            disabled={!hasResults}
            className={`px-6 py-2 text-xs font-medium rounded-md transition-colors border ${
              !hasResults
                ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'border-zinc-300 text-zinc-900 hover:bg-zinc-50 cursor-pointer'
            }`}
          >
            Export CSV
          </button>
        )}
        <button
          onClick={onRunReconciliation}
          className="px-6 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors"
        >
          Run Reconciliation
        </button>
      </div>
    </div>
  );
};
