import React from 'react';
import { FileSpreadsheet, Download, Bookmark, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { ReconcileResultItem } from '../types';

interface HeaderProps {
  results: ReconcileResultItem[];
  onExportCSV: () => void;
  onOpenTemplates: () => void;
  onResetToDefaults: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  results,
  onExportCSV,
  onOpenTemplates,
  onResetToDefaults,
}) => {
  const totalItems = results.length;
  const matchedItems = results.filter(r => r.matched).length;
  const varianceCount = results.filter(r => r.matched && Math.abs(r.difference) > 0.005).length;
  const totalVarianceAmt = results.reduce((sum, r) => sum + r.difference, 0);

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">XLOOKUP Reconciler</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetToDefaults}
            title="Reset to default mock datasets"
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            onClick={onOpenTemplates}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Templates
          </button>

          <button
            onClick={onExportCSV}
            disabled={totalItems === 0}
            className={`px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
              totalItems === 0
                ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'border-zinc-300 text-zinc-900 hover:bg-zinc-50 cursor-pointer'
            }`}
          >
            Export CSV
          </button>
        </div>
      </div>
    </header>
  );
};
