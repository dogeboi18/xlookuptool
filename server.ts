import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const RECONCILIATIONS_DIR = path.resolve(__dirname, 'reconciliations');
if (!fs.existsSync(RECONCILIATIONS_DIR)) {
  fs.mkdirSync(RECONCILIATIONS_DIR, { recursive: true });
}

// 1. Save reconciliation CSV directly into repository /reconciliations folder
app.post('/api/save-reconciliation', (req, res) => {
  try {
    const { filename, csvContent, metadata } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid csvContent in request body' });
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    let targetFilename = filename
      ? filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `reconciliation_${timestampStr}.csv`;

    if (!targetFilename.toLowerCase().endsWith('.csv')) {
      targetFilename += '.csv';
    }

    // Write file to repository reconciliations directory
    const filePath = path.join(RECONCILIATIONS_DIR, targetFilename);
    fs.writeFileSync(filePath, csvContent, 'utf-8');

    const stats = fs.statSync(filePath);
    const lineCount = csvContent.trim().split('\n').length;
    const rowCount = Math.max(0, lineCount - 1);

    return res.status(200).json({
      success: true,
      message: `Reconciliation saved to repository folder: reconciliations/${targetFilename}`,
      filename: targetFilename,
      relativePath: `reconciliations/${targetFilename}`,
      size: stats.size,
      rowCount,
      savedAt: stats.mtime.toISOString(),
      metadata: metadata || null,
    });
  } catch (err: any) {
    console.error('Error saving reconciliation to repository:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 2. List all saved reconciliation runs in repository
app.get('/api/saved-reconciliations', (_req, res) => {
  try {
    if (!fs.existsSync(RECONCILIATIONS_DIR)) {
      return res.json({ files: [] });
    }

    const files = fs
      .readdirSync(RECONCILIATIONS_DIR)
      .filter((file) => file.endsWith('.csv'))
      .map((file) => {
        const filePath = path.join(RECONCILIATIONS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          relativePath: `reconciliations/${file}`,
          size: stats.size,
          createdAt: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    return res.status(200).json({ files });
  } catch (err: any) {
    console.error('Error listing reconciliations:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 3. Download or view a specific saved reconciliation CSV
app.get('/api/saved-reconciliations/:filename', (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(RECONCILIATIONS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Reconciliation file not found' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.sendFile(filePath);
  } catch (err: any) {
    console.error('Error retrieving file:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 4. Delete a saved reconciliation CSV if needed
app.delete('/api/saved-reconciliations/:filename', (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(RECONCILIATIONS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    return res.json({ success: true, message: `Deleted ${safeFilename}` });
  } catch (err: any) {
    console.error('Error deleting reconciliation:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 5. Mount Make.com serverless reconcile API endpoint
app.post('/api/reconcile', async (req, res) => {
  try {
    const reconcileModule = await import('./api/reconcile.js').catch(async () => {
      return await import('./api/reconcile.ts');
    });
    const handler = reconcileModule.default;
    return await handler(req as any, res as any);
  } catch (err: any) {
    console.error('Error in /api/reconcile:', err);
    return res.status(500).json({ error: err.message || 'Reconciliation failed' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

start();
