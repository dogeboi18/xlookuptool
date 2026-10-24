import React from 'react';
import { HardDrive, LogOut, FolderGit2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { ReconcileResultItem } from '../types';

interface HeaderProps {
  results: ReconcileResultItem[];
  onExportCSV: () => void;
  onOpenTemplates: () => void;
  onResetToDefaults: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveToDrive: () => void;
  onOpenSavedRuns?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  results,
  onExportCSV,
  onOpenTemplates,
  onResetToDefaults,
  user,
  onSignIn,
  onSignOut,
  onSaveToDrive,
  onOpenSavedRuns,
}) => {
  const totalItems = results.length;

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight">XLOOKUP Reconciler</h1>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
            Google Drive Enabled
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetToDefaults}
            title="Reset to default mock datasets"
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            onClick={onOpenTemplates}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Templates
          </button>

          {onOpenSavedRuns && (
            <button
              onClick={onOpenSavedRuns}
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Open repository reconciliations folder"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Repo Files</span>
            </button>
          )}

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

          <button
            onClick={onSaveToDrive}
            disabled={totalItems === 0}
            title="Save reconciliation results to Google Drive"
            className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
              totalItems === 0
                ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 cursor-pointer'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden sm:inline">Save to Drive</span>
            <span className="sm:hidden">Drive</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* User / Sign-in */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-zinc-200 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-medium">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs text-zinc-700 max-w-[120px] truncate hidden md:inline">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onSignOut}
                title="Sign out from Google"
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 text-xs font-medium bg-black hover:bg-zinc-800 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
