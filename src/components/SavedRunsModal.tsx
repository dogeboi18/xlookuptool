import React, { useEffect, useState } from 'react';
import { FolderGit2, Download, Trash2, RefreshCw, X, Check, FileSpreadsheet, Copy } from 'lucide-react';
import { fetchSavedReconciliations, deleteSavedReconciliation, SavedReconciliationFile } from '../services/reconciliationStorage';

interface SavedRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshTrigger?: number;
}

export const SavedRunsModal: React.FC<SavedRunsModalProps> = ({
  isOpen,
  onClose,
  onRefreshTrigger = 0,
}) => {
  const [files, setFiles] = useState<SavedReconciliationFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedReconciliations();
      setFiles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, onRefreshTrigger]);

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete ${filename} from repository folder?`)) return;
    const ok = await deleteSavedReconciliation(filename);
    if (ok) {
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
    }
  };

  const handleCopyPath = (relativePath: string) => {
    navigator.clipboard.writeText(relativePath);
    setCopiedName(relativePath);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-zinc-100 rounded-md text-zinc-900">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Repository Reconciliations Folder</h3>
              <p className="text-xs text-zinc-500 font-mono">/reconciliations/*.csv</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadFiles}
              disabled={loading}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
          <span>All executed reconciliations and exports are automatically saved here as CSV files.</span>
          <span className="font-medium text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
            {files.length} saved {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* File List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
          {loading && files.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
              <span>Scanning repository reconciliations directory...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
              <p className="font-medium text-zinc-700">No reconciliation CSVs in repository folder yet</p>
              <p className="text-zinc-500 mt-1">Run a reconciliation or click &ldquo;Export CSV&rdquo; to automatically save one.</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.filename}
                className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50/80 transition-colors group"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-mono font-medium text-zinc-900 truncate">
                      {file.filename}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-zinc-400 mt-1">
                    <span>{new Date(file.modifiedAt).toLocaleString()}</span>
                    <span>&bull;</span>
                    <span>{formatSize(file.size)}</span>
                    <span>&bull;</span>
                    <button
                      onClick={() => handleCopyPath(file.relativePath)}
                      className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                      title="Copy path"
                    >
                      {copiedName === file.relativePath ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied path</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy path</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <a
                    href={`/api/saved-reconciliations/${encodeURIComponent(file.filename)}`}
                    download={file.filename}
                    className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-md transition-colors"
                    title="Download CSV"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.filename)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Files in <code className="bg-zinc-200/70 px-1 py-0.5 rounded text-zinc-800">/reconciliations</code> can be committed directly to Git.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white font-medium rounded-md text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
