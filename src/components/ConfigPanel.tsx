import React, { useState } from 'react';
import { CsvDataset, ReconcileConfig, MatchType, MultiMatchStrategy } from '../types';

import { HardDrive, FolderGit2, Check, RefreshCw } from 'lucide-react';

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
  onSaveToDrive?: () => void;
  onOpenDrivePicker: (target: 'file1' | 'file2') => void;
  hasResults?: boolean;
  onOpenSavedRuns?: () => void;
  lastAutoSavedFile?: string | null;
  isAutoSaving?: boolean;
  savedRunsCount?: number;
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
  onSaveToDrive,
  onOpenDrivePicker,
  hasResults = false,
  onOpenSavedRuns,
  lastAutoSavedFile,
  isAutoSaving = false,
  savedRunsCount = 0,
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
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col items-center justify-center h-20 border border-dashed border-zinc-300 rounded-md bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <span className="text-xs text-zinc-600 font-medium">Upload File 1 CSV</span>
                  <input type="file" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'file1')} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => onOpenDrivePicker('file1')}
                  title="Import File 1 from Google Drive"
                  className="px-3.5 h-20 border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 flex flex-col items-center justify-center text-zinc-700 transition-colors cursor-pointer group"
                >
                  <HardDrive className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-700">Drive</span>
                </button>
              </div>
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
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col items-center justify-center h-20 border border-dashed border-zinc-300 rounded-md bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                  <span className="text-xs text-zinc-600 font-medium">Upload File 2 CSV</span>
                  <input type="file" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, 'file2')} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => onOpenDrivePicker('file2')}
                  title="Import File 2 from Google Drive"
                  className="px-3.5 h-20 border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 flex flex-col items-center justify-center text-zinc-700 transition-colors cursor-pointer group"
                >
                  <HardDrive className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-700">Drive</span>
                </button>
              </div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-zinc-200">
        {/* Repository auto-save indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {isAutoSaving ? (
            <div className="flex items-center gap-1.5 text-zinc-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              <span>Saving run to <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px] font-mono text-zinc-800">/reconciliations/</code>...</span>
            </div>
          ) : lastAutoSavedFile ? (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2 py-1 rounded-md">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to repo: <code className="font-mono text-[11px] font-medium text-emerald-900">{lastAutoSavedFile}</code></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-500">
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Auto-saving all runs to <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px] font-mono text-zinc-700">/reconciliations/</code></span>
            </div>
          )}
        </div>

        {/* Action Buttons beside Run Reconciliation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenSavedRuns && (
            <button
              type="button"
              onClick={onOpenSavedRuns}
              className="px-3 py-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open repository reconciliations folder"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-600" />
              <span>Saved Runs</span>
              {savedRunsCount > 0 && (
                <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold">
                  {savedRunsCount}
                </span>
              )}
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              disabled={!hasResults}
              title="Export CSV and save to repository folder"
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors border ${
                !hasResults
                  ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'border-zinc-300 text-zinc-900 hover:bg-zinc-50 cursor-pointer'
              }`}
            >
              Export CSV
            </button>
          )}

          {onSaveToDrive && (
            <button
              onClick={onSaveToDrive}
              disabled={!hasResults}
              className={`px-4 py-2 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
                !hasResults
                  ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 cursor-pointer'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-zinc-700" />
              <span>Save to Drive</span>
            </button>
          )}

          <button
            onClick={onRunReconciliation}
            className="px-6 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Run Reconciliation
          </button>
        </div>
      </div>
    </div>
  );
};
