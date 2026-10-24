# XLOOKUP Reconciliation Engine & API

A high-performance, interactive financial and operational reconciliation tool that performs bidirectional lookups (XLOOKUP) between two datasets, calculates variances, aggregates duplicate keys, and interfaces directly with Google Drive and automation platforms like Make.com.

Built with **React**, **TypeScript**, **Tailwind CSS**, and **Vercel Serverless Functions**.

---

## 🚀 Key Features

- **Automated XLOOKUP Matching**: Reconcile records between primary (File 1) and reference (File 2) datasets using configurable lookup keys and amount/metric columns.
- **Key Normalization Options**:
  - Exact match
  - Case-insensitive & trimmed whitespace
  - Substring / fuzzy matching
- **Aggregation of Duplicate Keys**:
  - Toggle **"Aggregate File 1 Duplicate Keys"** to sum duplicate key balances before reconciliation, preventing multi-match skew.
- **Multi-Match Resolution**:
  - `First Match`: Traditional spreadsheet `XLOOKUP` behavior.
  - `Last Match`: Matches the final occurrence in File 2.
  - `Sum / Aggregate`: Sums all corresponding occurrences in File 2.
- **Tolerance & Precision**:
  - Define custom absolute tolerance thresholds (e.g., ignore variance < $0.05).
  - Configurable floating-point decimal precision.
- **Export & Storage**:
  - **Automated Repository Folder**: Automatically saves all ran reconciliations and exports directly to the repository's `/reconciliations/*.csv` folder with timestamps for git tracking and auditability.
  - Direct in-browser CSV download.
  - 1-click export to **Google Drive** with user confirmation dialogs.
  - Import CSV and native Google Sheets directly from Google Drive.
  - Interactive "Saved Runs" modal to browse, download, and manage saved CSV runs in `/reconciliations`.
- **Automated Webhook / Serverless API**:
  - Vercel Serverless endpoint at `/api/reconcile` for headless execution via **Make.com**, **Zapier**, **n8n**, or custom backend workflows.
- **Minimalist Aesthetic**: Clean, distraction-free monochrome design engineered for speed and precision.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend / Serverless**: `@vercel/node` serverless endpoint (`api/reconcile.ts`)
- **Cloud & Auth**: Firebase Auth + Google OAuth 2.0 (Google Drive REST API v3)
- **Deployment**: Vercel & Vite

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🌐 Deploy to Vercel

This repository includes a pre-configured `vercel.json` routing configuration supporting both the client single-page app and serverless API endpoints:

1. Push this repository to your GitHub account (instructions below).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework preset will automatically detect **Vite**.
5. Click **Deploy**.

---

## 🤖 Make.com / Webhook Integration

You can automate reconciliation runs directly through Make.com using HTTP modules:

### Headless API (`/api/reconcile`)
- **Method**: `POST`
- **URL**: `https://your-vercel-domain.vercel.app/api/reconcile` (or development app endpoint)
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "file1Text": "ID,Amount\nA100,500.00\nA101,250.00",
  "file2Text": "ID,Amount\nA100,500.00\nA101,240.00",
  "config": {
    "key1": "ID",
    "key2": "ID",
    "val1": "Amount",
    "val2": "Amount",
    "aggregateFile1": true,
    "caseSensitive": false,
    "multiMatchStrategy": "sum",
    "tolerance": 0.01,
    "decimalPlaces": 2
  }
}
```
- **Response**: Reconciled CSV stream with matched status, File 1 values, File 2 values, and computed variance columns.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
