import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, HardDrive } from 'lucide-react';
import { uploadCSVToDrive } from '../services/googleDrive';
import { googleSignIn } from '../utils/googleAuth';

interface SaveToDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvContent: string;
  rowCount: number;
  accessToken: string | null;
  onAuthSuccess: (token: string) => void;
}

export const SaveToDriveModal: React.FC<SaveToDriveModalProps> = ({
  isOpen,
  onClose,
  csvContent,
  rowCount,
  accessToken,
  onAuthSuccess,
}) => {
  const [fileName, setFileName] = useState(`xlookup_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        onAuthSuccess(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to authenticate with Google.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) {
      await handleSignIn();
      return;
    }

    if (!fileName.trim()) {
      setError('Please provide a valid file name.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await uploadCSVToDrive(accessToken, fileName.trim(), csvContent);
      setSuccessResult(result);
    } catch (err: any) {
      console.error('Failed to save to Google Drive:', err);
      setError(err.message || 'Failed to save file to Google Drive.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-semibold text-zinc-900">Save to Google Drive</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {successResult ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-900">Saved to Google Drive!</h4>
              <p className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-900">{successResult.name}</span> has been created in your Google Drive.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-xs text-zinc-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Destination:</span>
                  <span className="font-medium text-zinc-900">My Drive (Root)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reconciled Records:</span>
                  <span className="font-medium text-zinc-900">{rowCount} rows</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Format:</span>
                  <span className="font-medium text-zinc-900">CSV (.csv)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="xlookup_reconciliation.csv"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-md px-3 py-2 focus:border-black focus:ring-0"
                />
              </div>

              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!accessToken && (
                <p className="text-[11px] text-amber-600">
                  You will be prompted to sign in with your Google Account before the file is uploaded.
                </p>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{accessToken ? 'Confirm Save' : 'Sign In & Save'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
