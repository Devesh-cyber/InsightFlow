export type CleaningOperationType =
  | 'drop_duplicates'
  | 'drop_empty_columns'
  | 'drop_constant_columns'
  | 'drop_missing_rows'
  | 'fill_missing_mean'
  | 'fill_missing_median'
  | 'fill_missing_mode'
  | 'fill_missing_placeholder'
  | 'drop_column';

export type RecommendationSeverity = 'low' | 'moderate' | 'high' | 'very_high' | 'complete';

export interface CleaningOperation {
  operation: string;
  column_name: string | null;
  method: string | null;
  affected_rows: number;
  affected_columns: number;
  affected_cells: number;
  reason: string;
}

export interface CleaningRecommendation {
  column: string;
  issue: string;
  count: number;
  percentage: number;
  data_type: string;
  severity: RecommendationSeverity;
  suggested_operation: string | null;
  available_operations: string[];
  statistics: Record<string, unknown>;
  reason: string;
}

export interface CleaningRecommendationsResponse {
  status: string;
  recommendations: CleaningRecommendation[];
}

export interface CleaningRequest {
  operation: CleaningOperationType;
  column_name?: string | null;
  value?: string | null;
}

export interface CleaningResponse {
  status: string;
  message: string;
  rows: number;
  columns: number;
  is_modified: boolean;
  operation: CleaningOperation;
}

export interface CleaningPreviewResponse {
  status: string;
  operation: CleaningOperation;
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
}

export interface CleaningHistoryResponse {
  status: string;
  history: CleaningOperation[];
}
