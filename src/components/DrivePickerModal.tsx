import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Sheet, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { listDriveFiles, fetchDriveFileContent, DriveFile } from '../services/googleDrive';
import { googleSignIn } from '../utils/googleAuth';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (content: string, filename: string) => void;
  targetLabel: string;
  accessToken: string | null;
  onAuthSuccess: (token: string) => void;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  targetLabel,
  accessToken,
  onAuthSuccess,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFiles();
    }
  }, [isOpen, accessToken]);

  const loadFiles = async (query: string = searchQuery) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await listDriveFiles(accessToken, query);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error fetching Drive files:', err);
      setError(err.message || 'Failed to list files from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const handleSelect = async (file: DriveFile) => {
    if (!accessToken) return;
    setDownloading(true);
    setError(null);
    try {
      const content = await fetchDriveFileContent(accessToken, file.id, file.mimeType);
      onSelectFile(content, file.name);
      onClose();
    } catch (err: any) {
      console.error('Error downloading file from Drive:', err);
      setError(err.message || 'Failed to download file from Google Drive');
    } finally {
      setDownloading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        onAuthSuccess(res.accessToken);
        const driveFiles = await listDriveFiles(res.accessToken, searchQuery);
        setFiles(driveFiles);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Import from Google Drive</h3>
            <p className="text-xs text-zinc-500">Select a CSV or Google Sheet for {targetLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth prompt if not signed in */}
        {!accessToken ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <FileText className="w-6 h-6 text-zinc-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900">Connect Google Account</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Sign in with Google to access and import your spreadsheets and CSV files directly from Google Drive.
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search & Refresh Bar */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search files in Google Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md focus:border-black focus:ring-0"
                />
              </form>
              <button
                type="button"
                onClick={() => loadFiles(searchQuery)}
                disabled={loading}
                title="Refresh list"
                className="p-2 bg-white border border-zinc-200 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-3 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100">
              {loading ? (
                <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Loading files from Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No CSV files or Google Sheets found in your Google Drive matching the query.
                </div>
              ) : (
                files.map((file) => {
                  const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
                  return (
                    <div
                      key={file.id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-zinc-50 rounded-md transition-colors group cursor-pointer"
                      onClick={() => !downloading && handleSelect(file)}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-600">
                          {isSheet ? (
                            <Sheet className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-zinc-900 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>{isSheet ? 'Google Sheet (auto-export CSV)' : 'CSV File'}</span>
                            {file.modifiedTime && (
                              <>
                                <span>•</span>
                                <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={downloading}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 text-[11px] font-medium bg-black text-white rounded hover:bg-zinc-800 transition-all shrink-0"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">
                {downloading ? 'Downloading file...' : `${files.length} files available`}
              </span>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
