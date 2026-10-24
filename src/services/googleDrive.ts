export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Lists files from Google Drive matching CSVs, Google Sheets, or search term
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery: string = ''
): Promise<DriveFile[]> {
  let query = "trashed = false and (mimeType = 'text/csv' or mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.spreadsheet' or name contains '.csv' or name contains '.tsv')";
  
  if (searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query = `trashed = false and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('pageSize', '50');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size)');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch files: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads file content as text. If the file is a Google Sheet, exports it as CSV.
 */
export async function fetchDriveFileContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  let fetchUrl: string;

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
  } else {
    fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const response = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to download file content: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Uploads a reconciliation CSV directly to the user's Google Drive.
 */
export async function uploadCSVToDrive(
  accessToken: string,
  fileName: string,
  csvContent: string
): Promise<{ id: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName.endsWith('.csv') ? fileName : `${fileName}.csv`,
    mimeType: 'text/csv',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to save file to Drive: ${response.statusText}`);
  }

  return await response.json();
}
