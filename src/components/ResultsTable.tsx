import React, { useState, useMemo } from 'react';
import { ReconcileResultItem } from '../types';

interface ResultsTableProps {
  results: ReconcileResultItem[];
  file1Headers: string[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, file1Headers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'variance'>('all');

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const matchesSearch =
        item.lookupKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(item.file1OriginalRow).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

      if (!matchesSearch) return false;
      if (statusFilter === 'matched') return item.matched;
      if (statusFilter === 'unmatched') return !item.matched;
      if (statusFilter === 'variance') return item.matched && Math.abs(item.difference) > 0.005;

      return true;
    });
  }, [results, searchTerm, statusFilter]);

  const matchedCount = results.filter((r) => r.matched).length;
  const unmatchedCount = results.length - matchedCount;
  const varianceCount = results.filter((r) => r.matched && Math.abs(r.difference) > 0.005).length;

  if (results.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-zinc-200 rounded-md text-zinc-500 text-sm">
        No reconciliation results yet. Configure and run above.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Minimal Header / Filters */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
        <div className="flex gap-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          <span>Total: {results.length}</span>
          <span className="text-zinc-900">Matched: {matchedCount}</span>
          <span className="text-zinc-900">Unmatched: {unmatchedCount}</span>
          <span className="text-zinc-900">Variances: {varianceCount}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-zinc-400 font-medium tracking-wider">Filter</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border-b border-zinc-300 py-1 focus:border-black focus:ring-0 bg-transparent text-zinc-700"
            >
              <option value="all">All</option>
              <option value="matched">Matched</option>
              <option value="unmatched">Unmatched</option>
              <option value="variance">Variances Only</option>
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 text-xs border-b border-zinc-300 py-1 focus:border-black focus:ring-0 bg-transparent placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Minimalist Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-zinc-900 font-medium">
              <th className="py-2 pr-4 w-12 text-center">Match</th>
              <th className="py-2 pr-4">Lookup Key</th>
              <th className="py-2 pr-4 text-right">F1 Value</th>
              <th className="py-2 pr-4 text-right">F2 Lookup</th>
              <th className="py-2 pr-4 text-center">Count</th>
              <th className="py-2 pr-4 text-right">Difference</th>
              <th className="py-2 text-right">Var %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No records match current filters.
                </td>
              </tr>
            ) : (
              filteredResults.map((item) => {
                const hasVariance = item.matched && Math.abs(item.difference) > 0.005;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 pr-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.matched ? (hasVariance ? 'bg-zinc-500' : 'bg-black') : 'bg-zinc-300'}`}></span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{item.lookupKey}</td>
                    <td className="py-2.5 pr-4 text-right font-mono">
                      {item.file1Value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-500">
                      {item.matched ? item.file2Value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-center text-zinc-400">
                      {item.matched ? item.matchedFile2RowsCount : '-'}
                    </td>
                    <td className={`py-2.5 pr-4 text-right font-mono ${!item.matched ? 'text-zinc-300' : hasVariance ? 'font-medium text-black' : 'text-zinc-400'}`}>
                      {item.matched ? (item.difference > 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)) : '-'}
                    </td>
                    <td className={`py-2.5 text-right font-mono ${!item.matched ? 'text-zinc-300' : hasVariance ? 'text-black' : 'text-zinc-400'}`}>
                      {item.matched ? `${item.percentVariance.toFixed(2)}%` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
