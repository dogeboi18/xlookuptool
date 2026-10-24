export interface CsvDataset {
  rawText: string;
  headers: string[];
  rows: Record<string, string>[];
}

export type MatchType = 'exact' | 'substring';
export type MultiMatchStrategy = 'sum' | 'first' | 'last';

export interface ReconcileConfig {
  file1KeyCol: string;
  file1ValCol: string;
  file2KeyCol: string;
  file2ValCol: string;
  matchType: MatchType;
  multiMatchStrategy: MultiMatchStrategy;
  aggregateFile1: boolean;
}

export interface ReconcileResultItem {
  id: string;
  file1RowIndex: number;
  lookupKey: string;
  file1Value: number;
  matched: boolean;
  matchedFile2RowsCount: number;
  file2Value: number;
  difference: number;
  percentVariance: number;
  file1OriginalRow: Record<string, string>;
  file2MatchedSummary?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: ReconcileConfig;
  file1Text?: string;
  file2Text?: string;
}
