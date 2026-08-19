export type ColumnType =
  | 'numeric'
  | 'categorical'
  | 'boolean'
  | 'datetime'
  | 'unknown';

export interface ColumnSummary {
  column_name: string;
  detected_type: ColumnType;
  pandas_dtype: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
}

export interface NumericStatistics {
  minimum: number | null;
  maximum: number | null;
  mean: number | null;
  median: number | null;
  standard_deviation: number | null;
  skewness: number | null;
}

export interface ColumnAnalysis {
  summary: ColumnSummary;
  statistics: NumericStatistics | null;
  sample_values: unknown[];
}
