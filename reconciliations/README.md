# Saved Reconciliations

This folder automatically stores all executed reconciliation runs in CSV format.

Each file contains:
- **Status**: Match status (`TRUE` / `FALSE`)
- **Lookup Key**: Key identifier from File 1
- **File 1 Value**: Primary dataset numerical value
- **File 2 Looked-Up Value**: Matched reference numerical value
- **Matched Rows Count**: Number of rows found in File 2
- **Difference**: Computed numerical discrepancy (`File 1 - File 2`)
- **Percent Variance**: Percentage difference relative to File 2

Files are saved automatically whenever reconciliation runs or when exporting CSV, with timestamps for auditable tracking.
