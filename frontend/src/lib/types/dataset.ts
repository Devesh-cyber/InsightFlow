export interface ColumnMetadata {
  column_name: string;
  dtype: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
}

export interface DatasetMetadata {
  dataset_name: string;
  rows: number;
  columns: number;
  memory_usage: number;
  missing_cells: number;
  duplicate_rows: number;
  column_types: Record<string, number>;
  created_at: string;
}

export interface UploadResponse {
  status: string;
  message: string;
  dataset_id: string;
  filename: string;
  rows: number;
  columns: number;
}
