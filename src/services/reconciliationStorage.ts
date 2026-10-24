export interface SavedReconciliationFile {
  filename: string;
  relativePath: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export interface SaveReconciliationResponse {
  success: boolean;
  message: string;
  filename: string;
  relativePath: string;
  size: number;
  rowCount: number;
  savedAt: string;
}

export async function saveReconciliationToRepo(
  csvContent: string,
  filename?: string,
  metadata?: Record<string, any>
): Promise<SaveReconciliationResponse> {
  const response = await fetch('/api/save-reconciliation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      csvContent,
      filename,
      metadata,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function fetchSavedReconciliations(): Promise<SavedReconciliationFile[]> {
  try {
    const response = await fetch('/api/saved-reconciliations');
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error fetching saved reconciliations:', err);
    return [];
  }
}

export async function deleteSavedReconciliation(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/saved-reconciliations/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (err) {
    console.error('Error deleting saved reconciliation:', err);
    return false;
  }
}
